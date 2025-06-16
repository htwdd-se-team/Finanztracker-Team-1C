import { Injectable } from "@nestjs/common";
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

  /**
   * Creates a new transaction entry in the database.
   * @param data - The data for the new entry (from DTO)
   * @returns The created entry mapped to EntryResponseDto
   */
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
        startDate: data.startDate && data.startDate,
        endDate: data.endDate && data.endDate,
        transactionId: data.transactionId,
        recurringType: data.recurringType,
      },
    });

    return EntryService.mapEntryToResponseDto(entry);
  }

  async getEntries(
    user: User,
    { take, cursorId, sortBy }: EntryPaginationParamsDto,
  ): Promise<EntryPageDto> {
    const entries = await this.prisma.transaction.findMany({
      where: { userId: user.id },
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
