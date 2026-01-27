import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiSecurity,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
} from "@nestjs/swagger";
import { User } from "@prisma/client";

import { CreateCategoryUseCase } from "../../application/use-cases/categories/create-category.use-case";
import { DeleteCategoryUseCase } from "../../application/use-cases/categories/delete-category.use-case";
import { ListCategoriesUseCase } from "../../application/use-cases/categories/list-categories.use-case";
import { UpdateCategoryUseCase } from "../../application/use-cases/categories/update-category.use-case";
import { UserDecorator } from "../../decorators";
import { Category } from "../../domain/entities/category.entity";
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
  CategoryPaginationParamsDto,
} from "../../dto";
import { JwtAuthGuard } from "../../guards";

/**
 * Category Controller (DDD Architecture)
 *
 * Presentation layer that handles HTTP requests and delegates to use cases.
 * This controller is thin and only responsible for:
 * - Request validation (via DTOs)
 * - Calling appropriate use cases
 * - Transforming domain entities to DTOs for responses
 *
 * NOTE: This is the NEW DDD-based controller running temporarily on /categories-ddd
 * Once tests pass, it will replace the old controller at /categories
 */
@ApiTags("categories")
@Controller("categories")
@ApiSecurity("user-jwt")
@UseGuards(JwtAuthGuard)
export class CategoryDDDController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a new category" })
  @ApiOkResponse({
    type: CategoryResponseDto,
    description: "Successfully created category",
  })
  @ApiBadRequestResponse({ description: "Invalid request data" })
  async create(
    @UserDecorator() user: User,
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.createCategoryUseCase.execute({
      name: dto.name,
      color: dto.color,
      icon: dto.icon,
      userId: user.id,
    });

    return this.mapToResponseDto(category, 0);
  }

  @Get()
  @ApiOperation({ summary: "List all categories with pagination" })
  @ApiOkResponse({
    type: [CategoryResponseDto],
    description: "Successfully retrieved categories",
  })
  async list(
    @UserDecorator() user: User,
    @Query() params: CategoryPaginationParamsDto,
  ): Promise<CategoryResponseDto[]> {
    const categoriesWithUsage = await this.listCategoriesUseCase.execute({
      userId: user.id,
      sortBy: params.sortBy,
    });

    return categoriesWithUsage.map((cw) =>
      this.mapToResponseDto(cw.category, cw.usageCount),
    );
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a category" })
  @ApiOkResponse({
    type: CategoryResponseDto,
    description: "Successfully updated category",
  })
  @ApiNotFoundResponse({ description: "Category not found" })
  async update(
    @UserDecorator() user: User,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.updateCategoryUseCase.execute({
      categoryId: id,
      userId: user.id,
      name: dto.name,
      color: dto.color,
      icon: dto.icon,
    });

    // Get usage count for response
    const usageCount = 0; // Could be returned from use case if needed
    return this.mapToResponseDto(category, usageCount);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a category" })
  @ApiOkResponse({ description: "Successfully deleted category" })
  @ApiNotFoundResponse({ description: "Category not found" })
  async delete(
    @UserDecorator() user: User,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<void> {
    await this.deleteCategoryUseCase.execute({
      categoryId: id,
      userId: user.id,
    });
  }

  /**
   * Map domain entity to response DTO
   */
  private mapToResponseDto(
    category: Category,
    usageCount: number,
  ): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      color: category.color,
      icon: category.icon,
      createdAt: category.createdAt,
      usageCount,
    };
  }
}
