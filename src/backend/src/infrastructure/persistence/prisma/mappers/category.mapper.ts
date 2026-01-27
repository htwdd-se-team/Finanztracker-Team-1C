import { Injectable } from "@nestjs/common";
import { Category as PrismaCategory, Prisma } from "@prisma/client";

import { Category } from "../../../../domain/entities/category.entity";

/**
 * Category Mapper
 *
 * Maps between Domain Entity (Category) and Prisma Model (PrismaCategory).
 * This keeps the domain layer independent from Prisma.
 */
@Injectable()
export class CategoryMapper {
  /**
   * Convert Prisma model to Domain entity
   */
  toDomain(raw: PrismaCategory): Category {
    return Category.reconstitute({
      id: raw.id,
      name: raw.name,
      color: raw.color,
      icon: raw.icon,
      userId: raw.userId,
      createdAt: raw.createdAt,
    });
  }

  /**
   * Convert Domain entity to Prisma model for persistence
   * Used for both create and update operations
   */
  toPersistence(entity: Category): Prisma.CategoryUncheckedCreateInput {
    return {
      ...(entity.id !== null && { id: entity.id }),
      name: entity.name,
      color: entity.color,
      icon: entity.icon,
      userId: entity.userId,
      createdAt: entity.createdAt,
    };
  }

  /**
   * Convert Domain entity to update data
   */
  toUpdateData(entity: Category): Prisma.CategoryUpdateInput {
    return {
      name: entity.name,
      color: entity.color,
      icon: entity.icon,
      // userId und createdAt sind immutable und werden nicht aktualisiert
    };
  }
}
