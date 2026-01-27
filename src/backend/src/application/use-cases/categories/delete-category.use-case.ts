import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import {
  CATEGORY_REPOSITORY,
  ICategoryRepository,
} from "../../../domain/repositories/category.repository.interface";

export interface DeleteCategoryCommand {
  categoryId: number;
  userId: number;
}

/**
 * Delete Category Use Case
 *
 * Application service that orchestrates deleting a category.
 */
@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(command: DeleteCategoryCommand): Promise<void> {
    // Load existing category
    const category = await this.categoryRepository.findById(command.categoryId);

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    // Check authorization
    if (!category.belongsToUser(command.userId)) {
      throw new NotFoundException("Category not found");
    }

    // Delete category
    await this.categoryRepository.delete(command.categoryId);
  }
}
