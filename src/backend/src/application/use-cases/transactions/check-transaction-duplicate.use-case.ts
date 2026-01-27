import { Inject, Injectable } from "@nestjs/common";

import {
  TRANSACTION_REPOSITORY,
  ITransactionRepository,
} from "../../../domain/repositories/transaction.repository.interface";

export interface CheckTransactionDuplicateQuery {
  userId: number;
  amount: number;
  description: string | null;
  createdAt: Date;
}

/**
 * Check Transaction Duplicate Use Case
 *
 * Application service that checks if a transaction with the same criteria already exists.
 * Used for duplicate detection during import.
 */
@Injectable()
export class CheckTransactionDuplicateUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(query: CheckTransactionDuplicateQuery): Promise<boolean> {
    return this.transactionRepository.existsWithCriteria(
      query.userId,
      query.amount,
      query.description,
      query.createdAt,
    );
  }
}
