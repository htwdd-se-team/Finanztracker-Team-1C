import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { FilterSortOption, Prisma, Transaction, User } from "@prisma/client";

import {
  Currency,
  EntryPageDto,
  EntryPaginationParamsDto,
  EntrySortBy,
  UpdateEntryDto,
  type CreateEntryDto,
  type EntryResponseDto,
} from "../dto";

import { PrismaService } from "./prisma.service";
import { RecurringEntryService } from "./recurring-entry.service";

@Injectable()
export class EntryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recurringEntryService: RecurringEntryService,
  ) {}

  async createEntry(
    user: User,
    data: CreateEntryDto,
  ): Promise<EntryResponseDto> {
    // recurring entry
    if (data.isRecurring) {
      // shadow element
      const parentEntry = await this.prisma.transaction.create({
        data: {
          type: data.type,
          amount: data.amount,
          description: data.description,
          currency: data.currency || Currency.EUR,
          userId: user.id,
          isRecurring: true,
          categoryId: data.categoryId,
          createdAt: data.createdAt,
          recurringType: data.recurringType,
          recurringBaseInterval: data.recurringBaseInterval ?? 1,
          recurringDisabled: false,
        },
      });

      // actual transaction
      const childEntry = await this.prisma.transaction.create({
        data: {
          type: data.type,
          amount: data.amount,
          description: data.description,
          currency: data.currency || Currency.EUR,
          userId: user.id,
          isRecurring: false,
          categoryId: data.categoryId,
          createdAt: data.createdAt || new Date(),
          transactionId: parentEntry.id,
        },
      });

      return EntryService.mapEntryToResponseDto(childEntry);
    }

    // Create non-recurring entry
    const entry = await this.prisma.transaction.create({
      data: {
        type: data.type,
        amount: data.amount,
        description: data.description,
        currency: data.currency || Currency.EUR,
        userId: user.id,
        isRecurring: false,
        categoryId: data.categoryId,
        createdAt: data.createdAt,
      },
    });

    return EntryService.mapEntryToResponseDto(entry);
  }

  private mapFilterSortOptionToEntrySortBy(
    sortOption: FilterSortOption,
  ): EntrySortBy {
    switch (sortOption) {
      case FilterSortOption.HIGHEST_AMOUNT:
        return EntrySortBy.AMOUNT_DESC;
      case FilterSortOption.LOWEST_AMOUNT:
        return EntrySortBy.AMOUNT_ASC;
      case FilterSortOption.NEWEST_FIRST:
        return EntrySortBy.CREATED_AT_DESC;
      case FilterSortOption.OLDEST_FIRST:
        return EntrySortBy.CREATED_AT_ASC;
      default:
        return EntrySortBy.CREATED_AT_DESC;
    }
  }

  async getEntries(
    user: User,
    {
      take,
      cursorId,
      sortBy,
      dateFrom,
      dateTo,
      transactionType,
      categoryIds,
      amountMin,
      amountMax,
      title,
      filterId,
    }: EntryPaginationParamsDto,
  ): Promise<EntryPageDto> {
    if (filterId) {
      const filter = await this.prisma.filter.findUnique({
        where: { id: filterId, userId: user.id },
        include: { filterCategories: true },
      });

      if (!filter) {
        throw new NotFoundException("Filter not found");
      }

      if (filter.sortOption) {
        sortBy = this.mapFilterSortOptionToEntrySortBy(filter.sortOption);
      }

      if (filter.dateFrom) {
        dateFrom = filter.dateFrom;
      }

      if (filter.dateTo) {
        dateTo = filter.dateTo;
      }

      if (filter.transactionType) {
        transactionType = filter.transactionType;
      }

      if (filter.minPrice) {
        amountMin = filter.minPrice;
      }

      if (filter.maxPrice) {
        amountMax = filter.maxPrice;
      }

      if (filter.searchText) {
        title = filter.searchText;
      }

      if (filter.filterCategories.length) {
        categoryIds = filter.filterCategories.map((fc) => fc.categoryId);
      }
    }

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
      NOT: {
        isRecurring: true,
      },
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
    // Check if entry exists and belongs to user
    const entry = await this.prisma.transaction.findUnique({
      where: { id: entryId },
    });

    if (!entry || entry.userId !== user.id) {
      throw new NotFoundException(
        "Entry not found or not authorized to delete",
      );
    }

    // If this is a parent entry (recurring=true and no parent), disable it instead of deleting
    if (entry.isRecurring && !entry.transactionId) {
      await this.prisma.transaction.update({
        where: { id: entryId },
        data: { recurringDisabled: true },
      });
      return;
    }

    // Otherwise, delete normally (for child entries or non-recurring entries)
    await this.prisma.transaction.delete({
      where: { id: entryId },
    });
  }

  async updateEntry(
    user: User,
    entryId: number,
    data: UpdateEntryDto,
  ): Promise<EntryResponseDto> {
    const checkEntry = await this.prisma.transaction.findUnique({
      where: { id: entryId, userId: user.id },
    });

    if (!checkEntry) {
      throw new NotFoundException(
        "Entry not found or not authorized to update",
      );
    }

    if (
      !checkEntry.isRecurring &&
      (data.recurringType || data.recurringBaseInterval)
    ) {
      throw new BadRequestException(
        "Cannot update recurring properties for non-recurring entry",
      );
    }

    await this.prisma.transaction.updateMany({
      where: {
        id: entryId,
        userId: user.id,
      },
      data,
    });

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
      createdAt: entry.createdAt,
      isRecurring: entry.isRecurring,
      recurringType: entry.recurringType ?? undefined,
      recurringBaseInterval: entry.recurringBaseInterval ?? undefined,
      recurringDisabled: entry.recurringDisabled ?? undefined,
      transactionId: entry.transactionId ?? undefined,
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
