import { Inject, Injectable } from "@nestjs/common";

import { Category } from "../../../domain/entities/category.entity";
import {
  CATEGORY_REPOSITORY,
  ICategoryRepository,
  CategorySortBy,
} from "../../../domain/repositories/category.repository.interface";

export interface ListCategoriesQuery {
  userId: number;
  sortBy?: CategorySortBy;
}

export interface CategoryWithUsageCount {
  category: Category;
  usageCount: number;
}

/**
 * List Categories Use Case
 *
 * Application service that orchestrates listing categories with usage counts.
 */
@Injectable()
export class ListCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(query: ListCategoriesQuery): Promise<CategoryWithUsageCount[]> {
    // Get categories from repository
    const categories = await this.categoryRepository.findByUserId(
      query.userId,
      query.sortBy,
    );

    // Enrich with usage counts
    const categoriesWithUsage = await Promise.all(
      categories.map(async (category) => {
        const usageCount = await this.categoryRepository.getUsageCount(
          category.id,
        );
        return {
          category,
          usageCount,
        };
      }),
    );

    return categoriesWithUsage;
  }
}
