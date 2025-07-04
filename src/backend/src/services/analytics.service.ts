import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { sql } from "kysely";

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
}
