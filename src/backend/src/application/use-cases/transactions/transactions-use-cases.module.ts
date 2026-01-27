import { Module } from "@nestjs/common";

import { PersistenceModule } from "../../../infrastructure/persistence/persistence.module";

import { CheckTransactionDuplicateUseCase } from "./check-transaction-duplicate.use-case";
import { CreateTransactionUseCase } from "./create-transaction.use-case";
import { DeleteTransactionUseCase } from "./delete-transaction.use-case";
import { ListTransactionsUseCase } from "./list-transactions.use-case";
import { UpdateTransactionUseCase } from "./update-transaction.use-case";

/**
 * Transactions Use Cases Module
 *
 * Bundles all transaction-related use cases and their dependencies.
 */
@Module({
  imports: [PersistenceModule],
  providers: [
    CreateTransactionUseCase,
    UpdateTransactionUseCase,
    DeleteTransactionUseCase,
    ListTransactionsUseCase,
    CheckTransactionDuplicateUseCase,
  ],
  exports: [
    CreateTransactionUseCase,
    UpdateTransactionUseCase,
    DeleteTransactionUseCase,
    ListTransactionsUseCase,
    CheckTransactionDuplicateUseCase,
  ],
})
export class TransactionsUseCasesModule {}
