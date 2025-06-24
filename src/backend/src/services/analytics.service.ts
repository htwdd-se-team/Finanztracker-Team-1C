import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";

import {
  Granularity,
  TransactionBreakdownParamsDto,
  TransactionBreakdownResponseDto,
} from "../dto";

import { KyselyService } from "./kysely.service";
import { PrismaService } from "./prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kysely: KyselyService,
  ) {}

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
    const dateFormat = this.getDateFormat(granularity);

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
                .fn("date_trunc", [eb.val(dateTruncPeriod), "createdAt"])
                .as("date_period"),
              "type",
              "categoryId",
              "amount",
            ]),
        )
        .selectFrom("grouped_transactions")
        .select((eb) => [
          eb.fn("to_char", ["date_period", eb.val(dateFormat)]).as("date"),
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
          date: row.date as string,
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
                .fn("date_trunc", [eb.val(dateTruncPeriod), "createdAt"])
                .as("date_period"),
              "type",
              "amount",
            ]),
        )
        .selectFrom("grouped_transactions")
        .select((eb) => [
          eb.fn("to_char", ["date_period", eb.val(dateFormat)]).as("date"),
          "type",
          eb.fn.sum<string>("amount").as("value"),
        ])
        .groupBy(["date_period", "type"])
        .orderBy("date_period")
        .orderBy("type")
        .execute();

      return {
        data: results.map((row) => ({
          date: row.date as string,
          type: row.type,
          value: row.value,
        })),
      };
    }
  }

  private getDateFormat(granularity: Granularity): string {
    switch (granularity) {
      case Granularity.DAY:
        return "DD-MM-YYYY";
      case Granularity.WEEK:
        return "DD-MM-YYYY";
      case Granularity.MONTH:
        return "DD-MM-YYYY";
      case Granularity.YEAR:
        return "DD-MM-YYYY";
      default:
        return "DD-MM-YYYY";
    }
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
