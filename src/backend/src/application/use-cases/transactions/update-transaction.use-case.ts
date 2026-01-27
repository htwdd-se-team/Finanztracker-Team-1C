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
import { TransactionType } from "../../../domain/value-objects/transaction-type.vo";

export interface UpdateTransactionCommand {
  transactionId: number;
  userId: number;
  amount?: number;
  currency?: string;
  description?: string | null;
  type?: TransactionType;
  categoryId?: number | null;
  createdAt?: Date;
}

/**
 * Update Transaction Use Case
 *
 * Application service that orchestrates updating a transaction.
 */
@Injectable()
export class UpdateTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(command: UpdateTransactionCommand): Promise<Transaction> {
    // Load existing transaction
    const transaction = await this.transactionRepository.findById(
      command.transactionId,
    );

    if (!transaction) {
      throw new NotFoundException("Transaktion nicht gefunden");
    }

    // Check authorization
    if (!transaction.belongsToUser(command.userId)) {
      throw new NotFoundException("Transaktion nicht gefunden");
    }

    // Validate category if changed
    if (command.categoryId !== undefined && command.categoryId !== null) {
      const category = await this.categoryRepository.findById(
        command.categoryId,
      );
      if (!category || !category.belongsToUser(command.userId)) {
        throw new NotFoundException("Kategorie nicht gefunden");
      }
    }

    // Special case: If createdAt is being updated (for recurring entries),
    // we need to use Prisma directly since createdAt is readonly in domain
    if (command.createdAt !== undefined) {
      // Build update data directly for Prisma
      interface UpdateData {
        amount?: number;
        currency?: string;
        description?: string | null;
        type?: TransactionType;
        categoryId?: number | null;
        createdAt?: Date;
      }

      const updateData: UpdateData = {};
      if (command.amount !== undefined) updateData.amount = command.amount;
      if (command.currency !== undefined)
        updateData.currency = command.currency;
      if (command.description !== undefined)
        updateData.description = command.description;
      if (command.type !== undefined) updateData.type = command.type;
      if (command.categoryId !== undefined)
        updateData.categoryId = command.categoryId;
      if (command.createdAt !== undefined)
        updateData.createdAt = command.createdAt;

      // Use special repository method that allows createdAt update
      // This is a temporary workaround until we refactor recurring entry management
      const repository = this
        .transactionRepository as ITransactionRepository & {
        updateWithCreatedAt: (
          transactionId: number,
          updateData: UpdateData,
        ) => Promise<Transaction>;
      };
      return repository.updateWithCreatedAt(command.transactionId, updateData);
    }

    // Normal update through domain entity
    transaction.updateDetails(
      command.amount,
      command.currency,
      command.description,
      command.type,
      command.categoryId,
    );

    // Persist changes
    return this.transactionRepository.save(transaction);
  }
}
