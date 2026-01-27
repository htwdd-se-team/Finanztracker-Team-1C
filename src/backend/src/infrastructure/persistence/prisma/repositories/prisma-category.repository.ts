/* eslint-disable @darraghor/nestjs-typed/injectable-should-be-provided */
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { Category } from "../../../../domain/entities/category.entity";
import {
  ICategoryRepository,
  CategorySortBy,
} from "../../../../domain/repositories/category.repository.interface";
import { PrismaService } from "../../../../services/prisma.service";
import { CategoryMapper } from "../mappers/category.mapper";

/**
 * Prisma implementation of Category Repository
 *
 * This is the infrastructure layer implementation that uses Prisma
 * to persist and retrieve Category domain entities.
 *
 * NOTE: This is registered via DI Token (CATEGORY_REPOSITORY) in PersistenceModule.
 */

@Injectable()
export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: CategoryMapper,
  ) {}

  async findById(id: number): Promise<Category | null> {
    const data = await this.prisma.category.findUnique({
      where: { id },
    });

    return data ? this.mapper.toDomain(data) : null;
  }

  async findByUserId(
    userId: number,
    sortBy: CategorySortBy = CategorySortBy.CREATED_AT_DESC,
  ): Promise<Category[]> {
    const orderBy = this.buildOrderBy(sortBy);

    const categories = await this.prisma.category.findMany({
      where: { userId },
      orderBy,
    });

    return categories.map((c) => this.mapper.toDomain(c));
  }

  async save(category: Category): Promise<Category> {
    if (category.id === null) {
      // Create new category
      const data = this.mapper.toPersistence(category);
      const created = await this.prisma.category.create({
        data,
      });
      return this.mapper.toDomain(created);
    } else {
      // Update existing category
      const updateData = this.mapper.toUpdateData(category);
      const updated = await this.prisma.category.update({
        where: { id: category.id },
        data: updateData,
      });
      return this.mapper.toDomain(updated);
    }
  }

  async delete(id: number): Promise<void> {
    await this.prisma.category.delete({
      where: { id },
    });
  }

  async getUsageCount(categoryId: number): Promise<number> {
    return this.prisma.transaction.count({
      where: { categoryId },
    });
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.category.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Build Prisma orderBy clause based on sort option
   */
  private buildOrderBy(
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
}
