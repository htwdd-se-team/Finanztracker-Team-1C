import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import {
  TRANSACTION_REPOSITORY,
  ITransactionRepository,
} from "../../../domain/repositories/transaction.repository.interface";

export interface DeleteTransactionCommand {
  transactionId: number;
  userId: number;
}

/**
 * Delete Transaction Use Case
 *
 * Application service that orchestrates deleting a transaction.
 */
@Injectable()
export class DeleteTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(command: DeleteTransactionCommand): Promise<void> {
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

    // Delete transaction
    await this.transactionRepository.delete(command.transactionId);
  }
}
