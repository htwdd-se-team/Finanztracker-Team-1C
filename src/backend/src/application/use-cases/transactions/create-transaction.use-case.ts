import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import { Transaction } from "../../../domain/entities/transaction.entity";
import {
  CATEGORY_REPOSITORY,
  ICategoryRepository,
} from "../../../domain/repositories/category.repository.interface";
import {
  TRANSACTION_REPOSITORY,
  ITransactionRepository,
} from "../../../domain/repositories/transaction.repository.interface";
import { RecurringType } from "../../../domain/value-objects/recurring-type.vo";
import { TransactionType } from "../../../domain/value-objects/transaction-type.vo";

export interface CreateTransactionCommand {
  amount: number;
  currency?: string;
  description?: string | null;
  type: TransactionType;
  categoryId?: number | null;
  userId: number;
  createdAt?: Date;
  isRecurring?: boolean;
  recurringType?: RecurringType | null;
  recurringBaseInterval?: number;
}

export interface CreateTransactionResult {
  parent?: Transaction;
  child?: Transaction;
}

/**
 * Create Transaction Use Case
 *
 * Application service that orchestrates the creation of a new transaction.
 * Handles both regular and recurring transactions.
 */
@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(
    command: CreateTransactionCommand,
  ): Promise<CreateTransactionResult> {
    // Validate category exists and belongs to user
    if (command.categoryId) {
      const category = await this.categoryRepository.findById(
        command.categoryId,
      );
      if (!category || !category.belongsToUser(command.userId)) {
        throw new NotFoundException("Kategorie nicht gefunden");
      }
    }

    const finalCreatedAt = command.createdAt || new Date();

    // Handle recurring transaction
    if (command.isRecurring) {
      // Create parent (shadow) transaction
      const parent = Transaction.create({
        amount: command.amount,
        currency: command.currency,
        description: command.description,
        type: command.type,
        categoryId: command.categoryId,
        userId: command.userId,
        createdAt: finalCreatedAt,
        isRecurring: true,
        recurringType: command.recurringType,
        recurringBaseInterval: command.recurringBaseInterval || 1,
      });

      const savedParent = await this.transactionRepository.save(parent);

      // Only create child if date is not in the future
      const now = new Date();
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      if (finalCreatedAt <= todayEnd) {
        const child = Transaction.create({
          amount: command.amount,
          currency: command.currency,
          description: command.description,
          type: command.type,
          categoryId: command.categoryId,
          userId: command.userId,
          createdAt: finalCreatedAt,
          isRecurring: false,
          parentTransactionId: savedParent.id,
        });

        const savedChild = await this.transactionRepository.save(child);

        return { parent: savedParent, child: savedChild };
      }

      return { parent: savedParent };
    }

    // Create regular transaction
    const transaction = Transaction.create({
      amount: command.amount,
      currency: command.currency,
      description: command.description,
      type: command.type,
      categoryId: command.categoryId,
      userId: command.userId,
      createdAt: finalCreatedAt,
      isRecurring: false,
    });

    const saved = await this.transactionRepository.save(transaction);
    return { child: saved };
  }
}
