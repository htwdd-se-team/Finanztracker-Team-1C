import { Inject, Injectable } from "@nestjs/common";

import { Category } from "../../../domain/entities/category.entity";
import {
  CATEGORY_REPOSITORY,
  ICategoryRepository,
} from "../../../domain/repositories/category.repository.interface";

export interface CreateCategoryCommand {
  name: string;
  color: string;
  icon: string;
  userId: number;
}

/**
 * Create Category Use Case
 *
 * Application service that orchestrates the creation of a new category.
 * Contains no business logic - that's in the domain entity.
 */
@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(command: CreateCategoryCommand): Promise<Category> {
    // Create domain entity (with validation in entity)
    const category = Category.create({
      name: command.name,
      color: command.color,
      icon: command.icon,
      userId: command.userId,
    });

    // Persist through repository
    return this.categoryRepository.save(category);
  }
}
