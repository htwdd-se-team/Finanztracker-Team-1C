import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, Transaction, User } from "@prisma/client";

import {
  Currency,
  EntryPageDto,
  EntryPaginationParamsDto,
  EntrySortBy,
  type CreateEntryDto,
  type EntryResponseDto,
} from "../dto";

import { PrismaService } from "./prisma.service";

@Injectable()
export class EntryService {
  constructor(private readonly prisma: PrismaService) {}

  async createEntry(
    user: User,
    data: CreateEntryDto,
  ): Promise<EntryResponseDto> {
    const entry = await this.prisma.transaction.create({
      data: {
        type: data.type,
        amount: data.amount,
        description: data.description,
        currency: data.currency || Currency.EUR,
        userId: user.id,
        isRecurring: data.isRecurring ?? false,
        recurringInterval: data.recurringInterval,
        categoryId: data.categoryId,
        startDate: data.startDate,
        endDate: data.endDate,
        transactionId: data.transactionId,
        recurringType: data.recurringType,
      },
    });

    return EntryService.mapEntryToResponseDto(entry);
  }

  async getEntries(
    user: User,
    {
      take,
      cursorId,
      sortBy = EntrySortBy.CREATED_AT_DESC,
      dateFrom,
      dateTo,
      transactionType,
      categoryIds,
      amountMin,
      amountMax,
      title,
    }: EntryPaginationParamsDto,
  ): Promise<EntryPageDto> {
    const whereClause: Prisma.TransactionWhereInput = {
      userId: user.id,
      ...(dateFrom && {
        createdAt: {
          ...(dateTo ? { gte: dateFrom, lte: dateTo } : { gte: dateFrom }),
        },
      }),
      ...(dateTo &&
        !dateFrom && {
          createdAt: {
            lte: dateTo,
          },
        }),
      ...(transactionType && {
        type: transactionType,
      }),
      ...(categoryIds?.length && {
        categoryId: { in: categoryIds },
      }),
      ...((amountMin !== undefined || amountMax !== undefined) && {
        amount: {
          ...(amountMin !== undefined && { gte: amountMin }),
          ...(amountMax !== undefined && { lte: amountMax }),
        },
      }),
      ...(title && {
        description: {
          contains: title,
          mode: "insensitive",
        },
      }),
    };

    const entries = await this.prisma.transaction.findMany({
      where: whereClause,
      ...(cursorId && {
        cursor: { id: cursorId },
        skip: 1,
      }),
      take: take,
      orderBy: EntryService.getOrderByEntry(sortBy),
    });

    return {
      entries: entries.map((entry) =>
        EntryService.mapEntryToResponseDto(entry),
      ),
      cursorId:
        entries.length === take ? entries[entries.length - 1]?.id : null,
      count: entries.length,
    };
  }

  async deleteEntry(user: User, entryId: number): Promise<void> {
    const deleted = await this.prisma.transaction.deleteMany({
      where: {
        id: entryId,
        userId: user.id,
      },
    });

    if (!deleted.count) {
      throw new NotFoundException(
        "Entry not found or not authorized to delete",
      );
    }
  }

  async updateEntry(
    user: User,
    entryId: number,
    data: Partial<CreateEntryDto>,
  ): Promise<EntryResponseDto> {
    const updated = await this.prisma.transaction.updateMany({
      where: {
        id: entryId,
        userId: user.id,
      },
      data,
    });

    if (!updated.count) {
      throw new NotFoundException(
        "Entry not found or not authorized to update",
      );
    }

    const entry = await this.prisma.transaction.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new NotFoundException("Entry not found after update");
    }

    return EntryService.mapEntryToResponseDto(entry);
  }

  static mapEntryToResponseDto(entry: Transaction): EntryResponseDto {
    return {
      id: entry.id,
      type: entry.type,
      amount: entry.amount,
      description: entry.description,
      currency: entry.currency as Currency,
      categoryId: entry.categoryId,
      endDate: entry.endDate,
      createdAt: entry.createdAt,
      isRecurring: entry.isRecurring,
      recurringInterval: entry.recurringInterval,
      recurringType: entry.recurringType,
      transactionId: entry.transactionId,
      startDate: entry.startDate,
    };
  }

  static getOrderByEntry(
    sortBy: EntrySortBy,
  ): Prisma.TransactionOrderByWithRelationInput {
    switch (sortBy) {
      case EntrySortBy.CREATED_AT_ASC:
        return { createdAt: "asc" };
      case EntrySortBy.AMOUNT_ASC:
        return { amount: "asc" };
      case EntrySortBy.AMOUNT_DESC:
        return { amount: "desc" };
      case EntrySortBy.CREATED_AT_DESC:
      default:
        return { createdAt: "desc" };
    }
  }
}
