import { Category } from "../entities/category.entity";

export enum CategorySortBy {
  USAGE_DESC = "usage_desc",
  CREATED_AT_ASC = "createdAt_asc",
  CREATED_AT_DESC = "createdAt_desc",
  ALPHA_ASC = "alpha_asc",
  ALPHA_DESC = "alpha_desc",
}

/**
 * Category Repository Interface
 *
 * Defines the contract for category persistence.
 * This interface belongs to the domain layer, but is implemented in infrastructure layer.
 *
 * Following the Repository Pattern and Dependency Inversion Principle:
 * - Domain layer defines the interface (what it needs)
 * - Infrastructure layer implements it (how it's done with Prisma)
 */
export interface ICategoryRepository {
  /**
   * Find a category by its ID
   */
  findById(id: number): Promise<Category | null>;

  /**
   * Find all categories for a user with optional sorting
   */
  findByUserId(userId: number, sortBy?: CategorySortBy): Promise<Category[]>;

  /**
   * Save a category (create or update)
   * If category.id is null, creates a new category.
   * If category.id exists, updates the existing category.
   */
  save(category: Category): Promise<Category>;

  /**
   * Delete a category by ID
   */
  delete(id: number): Promise<void>;

  /**
   * Get the usage count for a category (how many transactions use it)
   */
  getUsageCount(categoryId: number): Promise<number>;

  /**
   * Check if a category exists
   */
  exists(id: number): Promise<boolean>;
}

/**
 * Symbol for Dependency Injection
 * Used in NestJS to inject the implementation
 */
export const CATEGORY_REPOSITORY = Symbol("ICategoryRepository");
