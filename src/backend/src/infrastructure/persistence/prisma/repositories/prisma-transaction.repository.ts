/* eslint-disable @darraghor/nestjs-typed/injectable-should-be-provided */
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { Transaction } from "../../../../domain/entities/transaction.entity";
import {
  ITransactionRepository,
  TransactionFilter,
  TransactionPage,
  TransactionSortOption,
} from "../../../../domain/repositories/transaction.repository.interface";
import { PrismaService } from "../../../../services/prisma.service";
import { TransactionMapper } from "../mappers/transaction.mapper";

/**
 * Prisma implementation of Transaction Repository
 *
 * This is the infrastructure layer implementation that uses Prisma
 * to persist and retrieve Transaction domain entities.
 *
 * NOTE: This is registered via DI Token (TRANSACTION_REPOSITORY) in PersistenceModule.
 */

@Injectable()
export class PrismaTransactionRepository implements ITransactionRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: TransactionMapper,
  ) {}

  async findById(id: number): Promise<Transaction | null> {
    const data = await this.prisma.transaction.findUnique({
      where: { id },
    });

    return data ? this.mapper.toDomain(data) : null;
  }

  async findByUserId(
    userId: number,
    filter?: TransactionFilter,
  ): Promise<TransactionPage> {
    let whereClause = this.buildWhereClause(userId, filter);
    const orderBy = this.buildOrderBy(filter?.sortOption);

    // If cursorId (offset) is provided, add it to the where clause
    // to get items after this cursor
    if (filter?.offset) {
      whereClause = {
        ...whereClause,
        id: {
          lt: filter.offset, // Less than cursor ID for descending order
        },
      };
    }

    const [items, totalCount] = await Promise.all([
      this.prisma.transaction.findMany({
        where: whereClause,
        orderBy,
        take: filter?.limit,
      }),
      this.prisma.transaction.count({
        where: this.buildWhereClause(userId, filter), // Count without cursor
      }),
    ]);

    const transactions = items.map((item) => this.mapper.toDomain(item));

    const hasMore = filter?.limit ? items.length === filter.limit : false;

    return {
      items: transactions,
      totalCount,
      hasMore,
    };
  }

  async findRecurringByParentId(parentId: number): Promise<Transaction[]> {
    const items = await this.prisma.transaction.findMany({
      where: { transactionId: parentId },
      orderBy: { createdAt: "desc" },
    });

    return items.map((item) => this.mapper.toDomain(item));
  }

  async findActiveRecurringParents(): Promise<Transaction[]> {
    const items = await this.prisma.transaction.findMany({
      where: {
        isRecurring: true,
        transactionId: null, // Parent transactions have no parent
        recurringDisabled: false,
      },
    });

    return items.map((item) => this.mapper.toDomain(item));
  }

  async save(transaction: Transaction): Promise<Transaction> {
    if (transaction.id === null) {
      // Create new transaction
      const data = this.mapper.toPersistence(transaction);
      const created = await this.prisma.transaction.create({
        data,
      });
      return this.mapper.toDomain(created);
    } else {
      // Update existing transaction
      const updateData = this.mapper.toUpdateData(transaction);
      const updated = await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: updateData,
      });
      return this.mapper.toDomain(updated);
    }
  }

  /**
   * Update transaction with createdAt override
   * Special case for recurring entries where createdAt can be changed
   */
  async updateWithCreatedAt(
    transactionId: number,
    updateData: Prisma.TransactionUncheckedUpdateInput,
  ): Promise<Transaction> {
    const updated = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: updateData,
    });
    return this.mapper.toDomain(updated);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.transaction.delete({
      where: { id },
    });
  }

  async existsWithCriteria(
    userId: number,
    amount: number,
    description: string | null,
    createdAt: Date,
  ): Promise<boolean> {
    const count = await this.prisma.transaction.count({
      where: {
        userId,
        amount,
        description,
        createdAt,
      },
    });
    return count > 0;
  }

  async count(userId: number, filter?: TransactionFilter): Promise<number> {
    const whereClause = this.buildWhereClause(userId, filter);
    return this.prisma.transaction.count({
      where: whereClause,
    });
  }

  /**
   * Build Prisma where clause from filter
   */
  private buildWhereClause(
    userId: number,
    filter?: TransactionFilter,
  ): Prisma.TransactionWhereInput {
    const where: Prisma.TransactionWhereInput = {
      userId,
    };

    if (!filter) {
      return where;
    }

    // Amount filters
    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where.amount = {};
      if (filter.minPrice !== undefined) {
        where.amount.gte = filter.minPrice;
      }
      if (filter.maxPrice !== undefined) {
        where.amount.lte = filter.maxPrice;
      }
    }

    // Date filters
    if (filter.dateFrom !== undefined || filter.dateTo !== undefined) {
      where.createdAt = {};
      if (filter.dateFrom !== undefined) {
        where.createdAt.gte = filter.dateFrom;
      }
      if (filter.dateTo !== undefined) {
        where.createdAt.lte = filter.dateTo;
      }
    }

    // Search text (in description)
    if (filter.searchText) {
      where.description = {
        contains: filter.searchText,
        mode: "insensitive",
      };
    }

    // Transaction type
    if (filter.transactionType) {
      where.type = filter.transactionType;
    }

    // Category filter
    if (filter.categoryIds && filter.categoryIds.length > 0) {
      where.categoryId = {
        in: filter.categoryIds,
      };
    }

    return where;
  }

  /**
   * Build Prisma orderBy clause based on sort option
   */
  private buildOrderBy(
    sortOption?: TransactionSortOption,
  ):
    | Prisma.TransactionOrderByWithRelationInput
    | Prisma.TransactionOrderByWithRelationInput[] {
    switch (sortOption) {
      case TransactionSortOption.HIGHEST_AMOUNT:
        return { amount: "desc" };
      case TransactionSortOption.LOWEST_AMOUNT:
        return { amount: "asc" };
      case TransactionSortOption.OLDEST_FIRST:
        return { createdAt: "asc" };
      case TransactionSortOption.NEWEST_FIRST:
      default:
        return [{ createdAt: "desc" }, { id: "desc" }];
    }
  }
}
