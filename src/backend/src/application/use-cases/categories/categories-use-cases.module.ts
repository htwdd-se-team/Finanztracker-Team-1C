import { Module } from "@nestjs/common";

import { PersistenceModule } from "../../../infrastructure/persistence/persistence.module";

import { CreateCategoryUseCase } from "./create-category.use-case";
import { DeleteCategoryUseCase } from "./delete-category.use-case";
import { ListCategoriesUseCase } from "./list-categories.use-case";
import { UpdateCategoryUseCase } from "./update-category.use-case";

/**
 * Categories Use Cases Module
 *
 * Bundles all category-related use cases and their dependencies.
 */
@Module({
  imports: [PersistenceModule],
  providers: [
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    ListCategoriesUseCase,
  ],
  exports: [
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    ListCategoriesUseCase,
  ],
})
export class CategoriesUseCasesModule {}
