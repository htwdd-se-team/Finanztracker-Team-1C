import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import { Category } from "../../../domain/entities/category.entity";
import {
  CATEGORY_REPOSITORY,
  ICategoryRepository,
} from "../../../domain/repositories/category.repository.interface";

export interface UpdateCategoryCommand {
  categoryId: number;
  userId: number;
  name?: string;
  color?: string;
  icon?: string;
}

/**
 * Update Category Use Case
 *
 * Application service that orchestrates updating a category.
 */
@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(command: UpdateCategoryCommand): Promise<Category> {
    // Load existing category
    const category = await this.categoryRepository.findById(command.categoryId);

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    // Check authorization (domain behavior)
    if (!category.belongsToUser(command.userId)) {
      throw new NotFoundException("Category not found");
    }

    // Update category (domain behavior with validation)
    category.updateDetails(command.name, command.color, command.icon);

    // Persist changes
    return this.categoryRepository.save(category);
  }
}
