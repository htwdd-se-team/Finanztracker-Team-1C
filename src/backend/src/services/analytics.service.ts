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
  AvailableCapitalItemDto,
} from "../dto";

import { KyselyService } from "./kysely.service";
import { PrismaService } from "./prisma.service";
import { RecurringEntryService } from "./recurring-entry.service";

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kysely: KyselyService,
    private readonly recurringEntryService: RecurringEntryService,
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
            .where((eb) =>
              eb.or([
                eb("isRecurring", "=", false),
                eb("transactionId", "is not", null),
              ]),
            )
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
            .where((eb) =>
              eb.or([
                eb("isRecurring", "=", false),
                eb("transactionId", "is not", null),
              ]),
            )
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
          .where("isRecurring", "=", false)
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
          .where("isRecurring", "=", false)
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

  async getAvailableCapital(user: User): Promise<AvailableCapitalItemDto[]> {
    const now = DateTime.now();
    const end = now.plus({ months: 1 }).startOf("month").toJSDate();

    // Current balance (sum of incomes - sum of expenses) using a single Kysely aggregate
    const aggRaw = await this.kysely
      .selectFrom("Transaction")
      .where("userId", "=", user.id)
      .where("isRecurring", "=", false)
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
          .as("balance"),
      ])
      .executeTakeFirst();

    const agg = aggRaw as Record<string, unknown> | undefined;
    const balance = Number(agg?.["balance"] ?? 0);

    const items: AvailableCapitalItemDto[] = [];

    items.push({
      key: "available_capital",
      label: "Available Capital",
      icon: "account-balance",
      value: balance,
      type: TransactionType.INCOME,
    });

    // Scheduled transactions in the current month grouped by category (child transactions)
    interface ScheduledCategoryRow {
      categoryId: number | null;
      categoryName: string | null;
      categoryIcon: string | null;
      type: TransactionType;
      value: number;
    }

    const rowsRaw = await this.kysely
      .selectFrom("Transaction")
      .leftJoin("Category", "Category.id", "Transaction.categoryId")
      .select((eb) => [
        eb.ref("Transaction.categoryId").as("categoryId"),
        eb.ref("Category.name").as("categoryName"),
        eb.ref("Category.icon").as("categoryIcon"),
        eb.ref("Transaction.type").as("type"),
        sql<number>`COALESCE(SUM("Transaction"."amount"), 0)`.as("value"),
      ])
      .where("Transaction.userId", "=", user.id)
      .where(sql<boolean>`"Transaction"."transactionId" IS NOT NULL`)
      .where("Transaction.createdAt", ">", sql<Date>`NOW()`)
      .where("Transaction.createdAt", "<", end)
      .groupBy([
        "Transaction.categoryId",
        "Category.name",
        "Category.icon",
        "Transaction.type",
      ])
      .orderBy("value", "desc")
      .execute();

    const rows: ScheduledCategoryRow[] = (rowsRaw as unknown[]).map((r) => {
      const rec = r as Record<string, unknown>;
      const categoryId =
        rec["categoryId"] == null ? null : Number(rec["categoryId"]);
      const categoryName =
        typeof rec["categoryName"] === "string" ? rec["categoryName"] : null;
      const categoryIcon =
        typeof rec["categoryIcon"] === "string" ? rec["categoryIcon"] : null;
      const type = rec["type"] as TransactionType;
      const value = Number(rec["value"] ?? 0);
      return {
        categoryId,
        categoryName,
        categoryIcon,
        type,
        value,
      };
    });

    // Calculate future incomes (sum of all positive scheduled transactions)
    const futureIncome = rows
      .filter((r) => r.type === TransactionType.INCOME)
      .reduce((sum, r) => sum + r.value, 0);

    // Insert future incomes at position 1 (after available_capital)
    items.splice(1, 0, {
      key: "future_incomes",
      label: "Future Incomes",
      icon: "fixed-income",
      value: futureIncome,
      type: TransactionType.INCOME,
    });

    // Add individual EXPENSE categories (INCOME already shown as total)
    for (const r of rows.filter((r) => r.type === TransactionType.EXPENSE)) {
      const value = r.value ?? 0;
      const categoryId = r.categoryId ?? null;
      items.push({
        key: `scheduled_category_${categoryId ?? "uncategorized"}`,
        label: r.categoryName ?? "uncategorized",
        icon: r.categoryIcon ?? "category",
        value: -value,
        type: r.type,
      });
    }

    return items;
  }
}
