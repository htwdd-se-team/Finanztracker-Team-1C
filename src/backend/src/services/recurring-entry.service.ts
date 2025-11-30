import { inspect } from "util";

import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { RecurringTransactionType } from "@prisma/client";
import { sql } from "kysely";
import { DateTime } from "luxon";
import { BackendConfig } from "@/backend.config";
import {
  EntryResponseDto,
  ScheduledEntriesParamsDto,
  ScheduledEntriesResponseDto,
  ScheduledMonthlyTotalsResponseDto,
} from "@/dto";

import { EntryService } from "./entry.service";
import { KyselyService } from "./kysely.service";
import { PrismaService } from "./prisma.service";

@Injectable()
export class RecurringEntryService {
  private readonly logger = new Logger(RecurringEntryService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(BackendConfig) private readonly backendConfig: BackendConfig,
    private readonly kysely: KyselyService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processRecurringEntries(): Promise<void> {
    if (!this.backendConfig.RUN_SCHEDULED_ENTRIES) {
      return;
    }

    this.logger.debug("Starting recurring entry processing...");

    // Get all active (not disabled) parent entries
    const parentEntries = await this.prisma.transaction.findMany({
      where: {
        isRecurring: true,
        recurringDisabled: false,
        transactionId: null, // Only parents
      },
    });

    this.logger.debug(`Found ${parentEntries.length} active recurring entries`);

    for (const parent of parentEntries) {
      await this.createChildEntryForParent(parent.id);
    }

    this.logger.debug("Recurring entry processing completed");
  }

  /**
   * Creates a new child entry based on the parent's recurring configuration
   */
  private async createChildEntryForParent(parentId: number): Promise<void> {
    try {
      const parent = await this.prisma.transaction.findUnique({
        where: { id: parentId },
      });

      if (!parent || !parent.isRecurring || parent.recurringDisabled) {
        return;
      }

      // Get the last child entry to check when the next one should be created
      const lastChild = await this.prisma.transaction.findFirst({
        where: { transactionId: parentId },
        orderBy: { createdAt: "desc" },
      });

      // Determine if a new child should be created based on recurringType
      if (!parent.recurringType) {
        return;
      }
      const shouldCreateChild = this.shouldCreateChild(
        parent.recurringType,
        parent.recurringBaseInterval ?? 1,
        lastChild?.createdAt || parent.createdAt,
      );

      if (shouldCreateChild) {
        await this.prisma.transaction.create({
          data: {
            type: parent.type,
            amount: parent.amount,
            description: parent.description,
            currency: parent.currency,
            userId: parent.userId,
            isRecurring: false,
            categoryId: parent.categoryId,
            createdAt: DateTime.now().toJSDate(),
            transactionId: parentId,
          },
        });

        this.logger.debug(`Created child entry for parent ${parentId}`);
      }
    } catch (err: unknown) {
      const msg = `Error creating child entry for parent ${parentId}`;
      if (err instanceof Error) {
        this.logger.error(msg, err.stack);
      } else {
        // Use util.inspect to safely stringify objects (handles circular refs)
        this.logger.error(
          `${msg}: ${inspect(err, { depth: 3, compact: true })}`,
        );
      }
    }
  }

  /**
   * Determines if a new child entry should be created based on the recurring type
   * and the date of the last child entry.
   */
  private shouldCreateChild(
    recurringType: RecurringTransactionType,
    recurringBaseInterval: number,
    lastChildDate: Date,
  ): boolean {
    const today = DateTime.now().startOf("day");
    const lastDate = DateTime.fromJSDate(lastChildDate).startOf("day");

    // Calculate when the next occurrence should happen
    let nextOccurrence: DateTime;

    switch (recurringType) {
      case RecurringTransactionType.DAILY:
        nextOccurrence = lastDate.plus({ days: recurringBaseInterval });
        return today >= nextOccurrence;

      case RecurringTransactionType.WEEKLY:
        nextOccurrence = lastDate.plus({ weeks: recurringBaseInterval });
        return today >= nextOccurrence;

      case RecurringTransactionType.MONTHLY:
        nextOccurrence = lastDate.plus({ months: recurringBaseInterval });
        return today >= nextOccurrence;

      default:
        return false;
    }
  }

  async getScheduledEntries(
    userId: number,
    { disabled, take = 10, cursorId }: ScheduledEntriesParamsDto,
  ): Promise<ScheduledEntriesResponseDto> {
    const entries = await this.prisma.transaction.findMany({
      where: {
        userId,
        isRecurring: true,
        recurringDisabled: Boolean(disabled),
      },
      ...(cursorId && {
        cursor: { id: cursorId },
        skip: 1,
      }),
      take: take,
      orderBy: {
        amount: "desc",
      },
    });

    return {
      entries: entries.map((entry) =>
        EntryService.mapEntryToResponseDto(entry),
      ),
      count: entries.length,
      cursorId:
        entries.length === take ? entries[entries.length - 1]?.id : null,
    };
  }

  async getScheduledMonthlyTotals(
    userId: number,
    year?: number,
    month?: number,
  ): Promise<ScheduledMonthlyTotalsResponseDto> {
    const targetYear = year ?? DateTime.now().year;

    // If a single month is requested, restrict start/end to that month, otherwise use the whole year
    let start = DateTime.local(targetYear, 1, 1).toJSDate();
    let end = DateTime.local(targetYear + 1, 1, 1).toJSDate();
    if (month) {
      start = DateTime.local(targetYear, month, 1).startOf("day").toJSDate();
      end = DateTime.local(targetYear, month, 1)
        .plus({ months: 1 })
        .startOf("day")
        .toJSDate();
    }

    const rows = (await this.kysely
      .selectFrom("Transaction")
      .select([
        sql<number>`EXTRACT(MONTH FROM "createdAt")::int`.as("month"),
        sql<number>`
          COALESCE(SUM(CASE WHEN "type" = 'INCOME' THEN "amount" ELSE 0 END), 0)
        `.as("income"),
        sql<number>`
          COALESCE(SUM(CASE WHEN "type" = 'EXPENSE' THEN "amount" ELSE 0 END), 0)
        `.as("expense"),
      ])
      .where("userId", "=", userId)
      .where(sql<boolean>`"transactionId" IS NOT NULL`)
      .where("createdAt", ">=", start)
      .where("createdAt", "<", end)
      .groupBy(sql`EXTRACT(MONTH FROM "createdAt")::int`)
      .orderBy("month")
      .execute()) as {
      month: number;
      income: string | number;
      expense: string | number;
    }[];

    const map = new Map<number, { income: number; expense: number }>();
    for (const r of rows) {
      const m = Number(r.month);
      map.set(m, {
        income: Number(r.income) || 0,
        expense: Number(r.expense) || 0,
      });
    }

    const monthsToReturn = month
      ? [month]
      : Array.from({ length: 12 }, (_, i) => i + 1);

    const totals = monthsToReturn.map((m) => {
      const found = map.get(m) ?? { income: 0, expense: 0 };
      return {
        month: m,
        income: found.income,
        expense: found.expense,
        net: found.income - found.expense,
      };
    });

    return { totals };
  }

  /**
   * Disable a recurring parent entry (instead of deleting it)
   */
  async disableRecurringEntry(
    parentId: number,
    userId: number,
  ): Promise<EntryResponseDto> {
    const entry = await this.prisma.transaction.findUnique({
      where: { id: parentId },
    });

    if (!entry || entry.userId !== userId || !entry.isRecurring) {
      throw new Error("Invalid recurring entry");
    }

    await this.prisma.transaction.update({
      where: { id: parentId },
      data: { recurringDisabled: true },
    });

    const updatedEntry = await this.prisma.transaction.findUnique({
      where: { id: parentId },
    });

    return EntryService.mapEntryToResponseDto(updatedEntry);
  }

  /**
   * Re-enable a disabled recurring entry
   */
  async enableRecurringEntry(
    parentId: number,
    userId: number,
  ): Promise<EntryResponseDto> {
    const entry = await this.prisma.transaction.findUnique({
      where: { id: parentId },
    });

    if (!entry || entry.userId !== userId || !entry.isRecurring) {
      throw new Error("Invalid recurring entry");
    }

    await this.prisma.transaction.update({
      where: { id: parentId },
      data: { recurringDisabled: false },
    });

    const updatedEntry = await this.prisma.transaction.findUnique({
      where: { id: parentId },
    });

    return EntryService.mapEntryToResponseDto(updatedEntry);
  }
}
