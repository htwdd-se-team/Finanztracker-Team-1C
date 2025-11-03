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

import { UserDecorator } from "../decorators";
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
  CategoryPaginationParamsDto,
} from "../dto";
import { JwtAuthGuard } from "../guards";
import { CategoryService } from "../services";

@ApiTags("categories")
@Controller("categories")
@ApiSecurity("user-jwt")
@UseGuards(JwtAuthGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

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
    return this.categoryService.createCategory(user.id, dto);
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
    return this.categoryService.listCategories(user.id, params);
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
    return this.categoryService.updateCategory(user.id, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a category" })
  @ApiOkResponse({ description: "Successfully deleted category" })
  @ApiNotFoundResponse({ description: "Category not found" })
  async delete(
    @UserDecorator() user: User,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<void> {
    return this.categoryService.deleteCategory(user.id, id);
  }
}
