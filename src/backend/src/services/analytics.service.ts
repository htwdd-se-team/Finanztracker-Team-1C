import { Injectable } from "@nestjs/common";
import {
  User,
  TransactionType,
  RecurringTransactionType,
} from "@prisma/client";
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
                  sql`"createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${sql.raw(
                    `'${this.TIMEZONE}'`,
                  )}`,
                ])
                .as("date_period"),
              "type",
              "categoryId",
              "amount",
            ]),
        )
        .selectFrom("grouped_transactions")
        .where((eb) => {
          // Filter by timezone-aware date_period to match the grouping
          return eb.and([
            eb(
              "date_period",
              ">=",
              sql<Date>`date_trunc(${sql.raw(
                `'${dateTruncPeriod}'`,
              )}, ${sql.raw(
                `'${startDate.toISOString()}'`,
              )}::timestamp AT TIME ZONE 'UTC' AT TIME ZONE ${sql.raw(
                `'${this.TIMEZONE}'`,
              )})`,
            ),
            eb(
              "date_period",
              "<=",
              sql<Date>`date_trunc(${sql.raw(
                `'${dateTruncPeriod}'`,
              )}, ${sql.raw(
                `'${endDate.toISOString()}'`,
              )}::timestamp AT TIME ZONE 'UTC' AT TIME ZONE ${sql.raw(
                `'${this.TIMEZONE}'`,
              )})`,
            ),
          ]);
        })
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
                  sql`"createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${sql.raw(
                    `'${this.TIMEZONE}'`,
                  )}`,
                ])
                .as("date_period"),
              "type",
              "amount",
            ]),
        )
        .selectFrom("grouped_transactions")
        .where((eb) => {
          // Filter by timezone-aware date_period to match the grouping
          // This ensures transactions are filtered based on their timezone-aware date,
          // not just UTC timestamp, matching how they're grouped
          return eb.and([
            eb(
              "date_period",
              ">=",
              sql<Date>`date_trunc(${sql.raw(
                `'${dateTruncPeriod}'`,
              )}, ${sql.raw(
                `'${startDate.toISOString()}'`,
              )}::timestamp AT TIME ZONE 'UTC' AT TIME ZONE ${sql.raw(
                `'${this.TIMEZONE}'`,
              )})`,
            ),
            eb(
              "date_period",
              "<=",
              sql<Date>`date_trunc(${sql.raw(
                `'${dateTruncPeriod}'`,
              )}, ${sql.raw(
                `'${endDate.toISOString()}'`,
              )}::timestamp AT TIME ZONE 'UTC' AT TIME ZONE ${sql.raw(
                `'${this.TIMEZONE}'`,
              )})`,
            ),
          ]);
        })
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

    const endDateTime = DateTime.fromJSDate(end);

    // Current balance (sum of incomes - sum of expenses) using a single Kysely aggregate
    const aggRaw = await this.kysely
      .selectFrom("Transaction")
      .where("userId", "=", user.id)
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

    // ---------------------------
    // Recurring parents projection (future occurrences)
    // ---------------------------
    interface ScheduledCategoryRow {
      categoryId: number | null;
      categoryName: string | null;
      categoryIcon: string | null;
      type: TransactionType;
      value: number;
    }
    const parentsRaw = await this.kysely
      .selectFrom("Transaction")
      .leftJoin("Category", "Category.id", "Transaction.categoryId")
      .select((eb) => [
        eb.ref("Transaction.id").as("parentId"),
        eb.ref("Transaction.createdAt").as("createdAt"),
        eb.ref("Transaction.recurringType").as("recurringType"),
        eb.ref("Transaction.recurringBaseInterval").as("recurringBaseInterval"),
        eb.ref("Transaction.amount").as("amount"),
        eb.ref("Transaction.type").as("type"),
        eb.ref("Transaction.categoryId").as("categoryId"),
        eb.ref("Category.name").as("categoryName"),
        eb.ref("Category.icon").as("categoryIcon"),
      ])
      .where("Transaction.userId", "=", user.id)
      .where("Transaction.isRecurring", "=", true)
      .where("Transaction.recurringDisabled", "=", false)
      .where(sql<boolean>`"Transaction"."transactionId" IS NULL`)
      .execute();

    // Helper to add/aggregate rows by category & type
    const aggregatedRows = new Map<string, ScheduledCategoryRow>();
    const addRow = (row: ScheduledCategoryRow) => {
      const key = `${row.categoryId ?? "uncategorized"}|${row.type}`;
      const existing = aggregatedRows.get(key);
      if (existing) {
        existing.value += row.value;
      } else {
        aggregatedRows.set(key, { ...row });
      }
    };

    // Add existing child rows first
    for (const r of rows) {
      addRow(r);
    }

    // Project parents whose next occurrence is within current month and in the future
    // Only project if no child transaction exists for this parent
    const childParentIds = new Set<number>();
    const childrenRaw = await this.kysely
      .selectFrom("Transaction")
      .select("transactionId")
      .where("Transaction.userId", "=", user.id)
      .where(sql<boolean>`"Transaction"."transactionId" IS NOT NULL`)
      .where("Transaction.createdAt", ">", sql<Date>`NOW()`)
      .where("Transaction.createdAt", "<", end)
      .execute();

    for (const child of childrenRaw) {
      if (child.transactionId) {
        childParentIds.add(child.transactionId);
      }
    }

    // Project parents whose next occurrence is within current month and in the future
    // Only if no existing child for that parent in this month
    for (const raw of parentsRaw as Record<string, unknown>[]) {
      const parentId = Number(raw["parentId"] ?? 0);
      if (childParentIds.has(parentId)) {
        // Child already exists for this parent in this month, skip projection
        continue;
      }

      const recurringType = raw[
        "recurringType"
      ] as RecurringTransactionType | null;
      const baseInterval = Number(raw["recurringBaseInterval"] ?? 1);
      const createdAt = new Date(raw["createdAt"] as string);
      if (!recurringType) {
        continue;
      }

      const next = this.getNextOccurrence(
        DateTime.fromJSDate(createdAt),
        recurringType,
        baseInterval,
        now,
      );

      if (!next) {
        continue;
      }

      if (next >= now && next < endDateTime) {
        const type = raw["type"] as TransactionType;
        const amount = Number(raw["amount"] ?? 0);
        const categoryId =
          raw["categoryId"] == null ? null : Number(raw["categoryId"]);
        const categoryName =
          typeof raw["categoryName"] === "string" ? raw["categoryName"] : null;
        const categoryIcon =
          typeof raw["categoryIcon"] === "string" ? raw["categoryIcon"] : null;

        addRow({
          categoryId,
          categoryName,
          categoryIcon,
          type,
          value: amount,
        });
      }
    }

    const projectedRows = Array.from(aggregatedRows.values());

    // Calculate future incomes and expenses
    const futureIncomes = projectedRows
      .filter((r) => r.type === TransactionType.INCOME)
      .reduce((sum, r) => sum + r.value, 0);

    const futureExpenses = projectedRows
      .filter((r) => r.type === TransactionType.EXPENSE)
      .reduce((sum, r) => sum + r.value, 0);

    // Available Capital = Current Balance + Future Incomes - Future Expenses
    const availableCapital = balance + futureIncomes - futureExpenses;

    // Update the available_capital item with the calculated total
    items[0].value = availableCapital;

    // Add current balance as a separate item
    items.push({
      key: "current_balance",
      label: "Current Balance",
      icon: "account-balance-wallet",
      value: balance,
      type: TransactionType.INCOME,
    });

    // Add individual INCOME categories (split by category)
    for (const r of projectedRows.filter(
      (r) => r.type === TransactionType.INCOME,
    )) {
      const value = r.value ?? 0;
      const categoryId = r.categoryId ?? null;
      items.push({
        key: `scheduled_category_${categoryId ?? "uncategorized"}`,
        label: r.categoryName ?? "uncategorized",
        icon: r.categoryIcon ?? "category",
        value: value,
        type: r.type,
      });
    }

    // Add individual EXPENSE categories (split by category)
    for (const r of projectedRows.filter(
      (r) => r.type === TransactionType.EXPENSE,
    )) {
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

  /**
   * Compute next occurrence of a recurring entry that is >= now.
   */
  private getNextOccurrence(
    start: DateTime,
    recurringType: RecurringTransactionType,
    interval: number,
    now: DateTime,
  ): DateTime | null {
    if (interval <= 0) interval = 1;

    const clampToFuture = (unit: "days" | "weeks" | "months"): DateTime => {
      if (now <= start) return start;
      const diff = Math.floor(now.diff(start, unit).as(unit) / interval) + 1;
      return start.plus({ [unit]: diff * interval } as Record<string, number>);
    };

    switch (recurringType) {
      case RecurringTransactionType.DAILY:
        return clampToFuture("days");
      case RecurringTransactionType.WEEKLY:
        return clampToFuture("weeks");
      case RecurringTransactionType.MONTHLY:
        return clampToFuture("months");
      default:
        return null;
    }
  }
}
