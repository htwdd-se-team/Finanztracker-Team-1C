import { Injectable, NotFoundException } from "@nestjs/common";
import { Category, Prisma } from "@prisma/client";

import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryPaginationParamsDto,
  CategoryResponseDto,
  CategorySortBy,
} from "../dto";

import { PrismaService } from "./prisma.service";

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async createCategory(
    userId: number,
    dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.create({
      data: {
        ...dto,
        userId,
      },
    });
    return this.mapToResponseDto(category, 0);
  }

  async updateCategory(
    userId: number,
    id: number,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });
    if (!category) throw new NotFoundException("Category not found");

    const updated = await this.prisma.category.update({
      where: { id },
      data: dto,
    });
    const usageCount = await this.getUsageCount(id);
    return this.mapToResponseDto(updated, usageCount);
  }

  async deleteCategory(userId: number, id: number): Promise<void> {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });
    if (!category) throw new NotFoundException("Category not found");

    await this.prisma.category.delete({ where: { id } });
  }

  async listCategories(
    userId: number,
    params: CategoryPaginationParamsDto,
  ): Promise<CategoryResponseDto[]> {
    const orderBy = CategoryService.buildOrderBy(params.sortBy);

    const categories = await this.prisma.category.findMany({
      where: { userId },
      orderBy,
      include: {
        _count: {
          select: {
            Transaction: true,
          },
        },
      },
    });

    return categories.map((c) =>
      this.mapToResponseDto(c, c._count?.Transaction ?? 0),
    );
  }

  private static buildOrderBy(
    sortBy: CategorySortBy,
  ): Prisma.CategoryOrderByWithRelationInput {
    switch (sortBy) {
      case CategorySortBy.USAGE_DESC:
        return {
          Transaction: {
            _count: "desc",
          },
        };
      case CategorySortBy.CREATED_AT_ASC:
        return { createdAt: "asc" };
      case CategorySortBy.CREATED_AT_DESC:
        return { createdAt: "desc" };
      case CategorySortBy.ALPHA_ASC:
        return { name: "asc" };
      case CategorySortBy.ALPHA_DESC:
        return { name: "desc" };
      default:
        return { createdAt: "desc" };
    }
  }

  private async getUsageCount(categoryId: number): Promise<number> {
    return this.prisma.transaction.count({
      where: { categoryId },
    });
  }

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
