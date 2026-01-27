import { Inject, Injectable } from "@nestjs/common";

import {
  TRANSACTION_REPOSITORY,
  ITransactionRepository,
  TransactionFilter,
  TransactionPage,
} from "../../../domain/repositories/transaction.repository.interface";

export interface ListTransactionsQuery {
  userId: number;
  filter?: TransactionFilter;
}

/**
 * List Transactions Use Case
 *
 * Application service that orchestrates listing transactions with filtering and pagination.
 */
@Injectable()
export class ListTransactionsUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(query: ListTransactionsQuery): Promise<TransactionPage> {
    return this.transactionRepository.findByUserId(query.userId, query.filter);
  }
}
