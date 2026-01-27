import { Injectable } from "@nestjs/common";
import { Transaction as PrismaTransaction, Prisma } from "@prisma/client";

import { Transaction } from "../../../../domain/entities/transaction.entity";
import { Money } from "../../../../domain/value-objects/money.vo";
import { RecurringType } from "../../../../domain/value-objects/recurring-type.vo";
import { TransactionType } from "../../../../domain/value-objects/transaction-type.vo";

/**
 * Transaction Mapper
 *
 * Maps between Domain Entity (Transaction) and Prisma Model (PrismaTransaction).
 * This keeps the domain layer independent from Prisma.
 */
@Injectable()
export class TransactionMapper {
  /**
   * Convert Prisma model to Domain entity
   */
  toDomain(raw: PrismaTransaction): Transaction {
    return Transaction.reconstitute({
      id: raw.id,
      money: Money.create(raw.amount, raw.currency),
      description: raw.description,
      type: raw.type as TransactionType,
      categoryId: raw.categoryId,
      userId: raw.userId,
      createdAt: raw.createdAt,
      isRecurring: raw.isRecurring,
      recurringType: raw.recurringType as RecurringType | null,
      recurringBaseInterval: raw.recurringBaseInterval,
      recurringDisabled: raw.recurringDisabled,
      parentTransactionId: raw.transactionId,
    });
  }

  /**
   * Convert Domain entity to Prisma model for persistence
   * Used for create operations
   */
  toPersistence(entity: Transaction): Prisma.TransactionUncheckedCreateInput {
    return {
      ...(entity.id !== null && { id: entity.id }),
      amount: entity.money.amount,
      currency: entity.money.currency,
      description: entity.description,
      type: entity.type,
      categoryId: entity.categoryId,
      userId: entity.userId,
      createdAt: entity.createdAt,
      isRecurring: entity.isRecurring,
      recurringType: entity.recurringType,
      recurringBaseInterval: entity.recurringBaseInterval,
      recurringDisabled: entity.recurringDisabled,
      transactionId: entity.parentTransactionId,
    };
  }

  /**
   * Convert Domain entity to update data
   */
  toUpdateData(entity: Transaction): Prisma.TransactionUncheckedUpdateInput {
    return {
      amount: entity.money.amount,
      currency: entity.money.currency,
      description: entity.description,
      type: entity.type,
      categoryId: entity.categoryId,
      isRecurring: entity.isRecurring,
      recurringType: entity.recurringType,
      recurringBaseInterval: entity.recurringBaseInterval,
      recurringDisabled: entity.recurringDisabled,
      // userId, createdAt, parentTransactionId are immutable
    };
  }
}
