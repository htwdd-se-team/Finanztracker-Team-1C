import { Transaction } from "../entities/transaction.entity";
import { TransactionType } from "../value-objects/transaction-type.vo";

export interface TransactionFilter {
  minPrice?: number;
  maxPrice?: number;
  dateFrom?: Date;
  dateTo?: Date;
  searchText?: string;
  transactionType?: TransactionType;
  categoryIds?: number[];
  sortOption?: TransactionSortOption;
  limit?: number;
  offset?: number;
}

export enum TransactionSortOption {
  HIGHEST_AMOUNT = "HIGHEST_AMOUNT",
  LOWEST_AMOUNT = "LOWEST_AMOUNT",
  NEWEST_FIRST = "NEWEST_FIRST",
  OLDEST_FIRST = "OLDEST_FIRST",
}

export interface TransactionPage {
  items: Transaction[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * Transaction Repository Interface
 *
 * Defines the contract for transaction persistence.
 * This interface belongs to the domain layer, but is implemented in infrastructure layer.
 */
export interface ITransactionRepository {
  /**
   * Find a transaction by its ID
   */
  findById(id: number): Promise<Transaction | null>;

  /**
   * Find all transactions for a user with optional filtering and pagination
   */
  findByUserId(
    userId: number,
    filter?: TransactionFilter,
  ): Promise<TransactionPage>;

  /**
   * Find recurring transactions by parent ID
   */
  findRecurringByParentId(parentId: number): Promise<Transaction[]>;

  /**
   * Find all active recurring parent transactions
   * (parent transactions that are not disabled)
   */
  findActiveRecurringParents(): Promise<Transaction[]>;

  /**
   * Save a transaction (create or update)
   * If transaction.id is null, creates a new transaction.
   * If transaction.id exists, updates the existing transaction.
   */
  save(transaction: Transaction): Promise<Transaction>;

  /**
   * Delete a transaction by ID
   */
  delete(id: number): Promise<void>;

  /**
   * Check if a transaction exists with specific criteria (for duplicate detection)
   */
  existsWithCriteria(
    userId: number,
    amount: number,
    description: string | null,
    createdAt: Date,
  ): Promise<boolean>;

  /**
   * Count transactions for a user (optionally filtered)
   */
  count(userId: number, filter?: TransactionFilter): Promise<number>;
}

/**
 * Symbol for Dependency Injection
 * Used in NestJS to inject the implementation
 */
export const TRANSACTION_REPOSITORY = Symbol("ITransactionRepository");
