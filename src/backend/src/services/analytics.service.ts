import { Injectable } from "@nestjs/common";
import { User, TransactionType } from "@prisma/client";
import { sql } from "kysely";
import { DateTime } from "luxon";

import {
  Granularity,
  TransactionBreakdownParamsDto,
  TransactionBreakdownResponseDto,
  TransactionItemDto,
  TransactionBalanceHistoryParamsDto,
} from "../dto";

import { KyselyService } from "./kysely.service";
import { PrismaService } from "./prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kysely: KyselyService,
    private readonly recurringEntryService: import("./recurring-entry.service").RecurringEntryService,
  ) {}

  private TIMEZONE = "Europe/Berlin";

  async getTransactionBreakdown(
    user: User,
    {
      startDate,
      endDate,
      granularity,
      withCategory,
    }: TransactionBreakdownParamsDto,
  ): Promise<TransactionBreakdownResponseDto> {
    const dateTruncPeriod = this.getDateTruncPeriod(granularity);

    if (withCategory) {
      const results = await this.kysely
        .with("grouped_transactions", (db) =>
          db
            .selectFrom("Transaction")
            .where("userId", "=", user.id)
            .where("createdAt", ">=", startDate)
            .where("createdAt", "<=", endDate)
            .select((eb) => [
              eb
                .fn("date_trunc", [
                  eb.val(dateTruncPeriod),
                  sql`"createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${this.TIMEZONE}`,
                ])
                .as("date_period"),
              "type",
              "categoryId",
              "amount",
            ]),
        )
        .selectFrom("grouped_transactions")
        .select((eb) => [
          "date_period as date",
          "type",
          "categoryId as category",
          eb.fn.sum<string>("amount").as("value"),
        ])
        .groupBy(["date_period", "type", "categoryId"])
        .orderBy("date_period")
        .orderBy("type")
        .orderBy("categoryId")
        .execute();

      return {
        data: results.map((row) => ({
          date: row.date as Date,
          type: row.type,
          value: row.value,
          category: row.category || undefined,
        })),
      };
    } else {
      const results = await this.kysely
        .with("grouped_transactions", (db) =>
          db
            .selectFrom("Transaction")
            .where("userId", "=", user.id)
            .where("createdAt", ">=", startDate)
            .where("createdAt", "<=", endDate)
            .select((eb) => [
              eb
                .fn("date_trunc", [
                  eb.val(dateTruncPeriod),
                  sql`"createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${this.TIMEZONE}`,
                ])
                .as("date_period"),
              "type",
              "amount",
            ]),
        )
        .selectFrom("grouped_transactions")
        .select((eb) => [
          "date_period as date",
          "type",
          eb.fn.sum<string>("amount").as("value"),
        ])
        .groupBy(["date_period", "type"])
        .orderBy("date_period")
        .orderBy("type")
        .execute();

      return {
        data: results.map((row) => ({
          date: row.date as Date,
          type: row.type,
          value: row.value,
        })),
      };
    }
  }

  async getTransactionBalanceHistory(
    user: User,
    { startDate, endDate, granularity }: TransactionBalanceHistoryParamsDto,
  ): Promise<TransactionItemDto[]> {
    const dateTruncPeriod = this.getDateTruncPeriod(granularity);

    const results = await this.kysely
      // Get the initial balance similar to getBalance in user.service.ts
      .with("initial_balance", (db) =>
        db
          .selectFrom("Transaction")
          .where("userId", "=", user.id)
          .where("createdAt", "<", startDate)
          .where("createdAt", "<=", sql<Date>`NOW()`)
          .select((eb) => [
            eb.fn
              .sum(
                eb
                  .case()
                  .when("type", "=", "INCOME")
                  .then(eb.ref("amount"))
                  .when("type", "=", "EXPENSE")
                  .then(eb.neg(eb.ref("amount")))
                  .else(0)
                  .end(),
              )
              .as("initial_balance"),
          ]),
      )
      .with("transaction_impacts", (db) =>
        db
          .selectFrom("Transaction")
          .where("userId", "=", user.id)
          .where("createdAt", ">=", startDate)
          .where("createdAt", "<=", endDate)
          .where("createdAt", "<=", sql<Date>`NOW()`)
          .select((eb) => [
            eb
              .fn("date_trunc", [
                eb.val(dateTruncPeriod),
                sql`"createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${this.TIMEZONE}`,
              ])
              .as("period_date"),
            eb
              .case()
              .when("type", "=", "INCOME")
              .then(eb.ref("amount"))
              .when("type", "=", "EXPENSE")
              .then(eb.neg(eb.ref("amount")))
              .else(0)
              .end()
              .as("impact"),
          ]),
      )
      .with("period_totals", (db) =>
        db
          .selectFrom("transaction_impacts")
          .select((eb) => [
            "period_date",
            eb.fn.sum<string>("impact").as("net_amount"),
          ])
          .groupBy("period_date")
          .orderBy("period_date"),
      )
      .selectFrom("period_totals")
      .crossJoin("initial_balance")
      .select([
        "period_date as date",
        sql<string>`COALESCE(initial_balance, 0) + sum(net_amount) over (order by period_date)`.as(
          "cumulative_balance",
        ),
      ])
      .orderBy("period_date")
      .execute();

    return results.map((row) => ({
      date: row.date as Date,
      value: row.cumulative_balance,
    }));
  }

  private getDateTruncPeriod(granularity: Granularity): string {
    switch (granularity) {
      case Granularity.DAY:
        return "day";
      case Granularity.WEEK:
        return "week";
      case Granularity.MONTH:
        return "month";
      case Granularity.YEAR:
        return "year";
      default:
        return "day";
    }
  }

  async getMaxTransactionAmountForUser(user: User): Promise<number> {
    const agg = await this.prisma.transaction.aggregate({
      where: { userId: user.id },
      _max: { amount: true },
    });

    const max = agg._max?.amount ?? 0;
    const rounded = max > 0 ? Math.ceil(max / 100) * 100 : 0;
    return rounded;
  }

  async getAvailableCapital(
    user: User,
  ): Promise<import("../dto").AvailableCapitalItemDto[]> {
    const now = DateTime.now();
    const start = now.startOf("month").toJSDate();
    const end = now.plus({ months: 1 }).startOf("month").toJSDate();

    // Current balance (sum of incomes - sum of expenses)
    const incomeAgg = await this.prisma.transaction.aggregate({
      where: { userId: user.id, type: "INCOME" },
      _sum: { amount: true },
    });
    const expenseAgg = await this.prisma.transaction.aggregate({
      where: { userId: user.id, type: "EXPENSE" },
      _sum: { amount: true },
    });

    const incomeSum = incomeAgg._sum?.amount ?? 0;
    const expenseSum = expenseAgg._sum?.amount ?? 0;
    const balance = incomeSum - expenseSum;

    const items: import("../dto").AvailableCapitalItemDto[] = [];

    items.push({
      key: "available_capital",
      label: "Available Capital",
      icon: "account-balance",
      value: balance,
      type: TransactionType.INCOME,
    });

    // Future recurring incomes for the current month (uses scheduled monthly totals)
    try {
      const scheduled =
        await this.recurringEntryService.getScheduledMonthlyTotals(
          user.id,
          now.year,
          now.month,
        );
      const futureIncome = scheduled.totals?.[0]?.income ?? 0;
      items.push({
        key: "future_incomes",
        label: "Future Incomes",
        icon: "fixed-income",
        value: futureIncome,
        type: TransactionType.INCOME,
      });
    } catch {
      // If recurring totals fail, still return available capital
      items.push({
        key: "future_incomes",
        label: "Future Incomes",
        icon: "fixed-income",
        value: 0,
        type: TransactionType.INCOME,
      });
    }

    // Scheduled transactions in the current month grouped by category (child transactions created this month)
    interface ScheduledCategoryRow {
      categoryId: number | null;
      categoryName: string | null;
      categoryIcon: string | null;
      value: number;
    }

    const rowsRaw = await this.kysely
      .selectFrom("Transaction")
      .leftJoin("Category", "Category.id", "Transaction.categoryId")
      .select((eb) => [
        eb.ref("Transaction.categoryId").as("categoryId"),
        eb.ref("Category.name").as("categoryName"),
        eb.ref("Category.icon").as("categoryIcon"),
        sql<number>`COALESCE(SUM("Transaction"."amount"), 0)`.as("value"),
      ])
      .where("Transaction.userId", "=", user.id)
      .where(sql<boolean>`"Transaction"."transactionId" IS NOT NULL`)
      .where("Transaction.createdAt", ">=", start)
      .where("Transaction.createdAt", "<", end)
      .groupBy(["Transaction.categoryId", "Category.name", "Category.icon"])
      .orderBy("value", "desc")
      .execute();

    const rows: ScheduledCategoryRow[] = (rowsRaw as unknown[]).map((r) => {
      const obj = r as Record<string, unknown>;
      const rawCategoryId = obj["categoryId"];
      const categoryId =
        typeof rawCategoryId === "number"
          ? rawCategoryId
          : rawCategoryId == null
            ? null
            : Number(rawCategoryId);

      const rawCategoryName = obj["categoryName"];
      const categoryName =
        typeof rawCategoryName === "string" ? rawCategoryName : null;

      const rawCategoryIcon = obj["categoryIcon"];
      const categoryIcon =
        typeof rawCategoryIcon === "string" ? rawCategoryIcon : null;

      const rawValue = obj["value"];
      const value =
        typeof rawValue === "number"
          ? rawValue
          : rawValue == null
            ? 0
            : Number(rawValue);

      return {
        categoryId,
        categoryName,
        categoryIcon,
        value,
      };
    });

    for (const r of rows) {
      const value = r.value ?? 0;
      const categoryId = r.categoryId ?? null;
      items.push({
        key: `scheduled_category_${categoryId ?? "uncategorized"}`,
        label: r.categoryName ?? "uncategorized",
        icon: r.categoryIcon ?? "category",
        value,
        type: value >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
      });
    }

    return items;
  }
}
