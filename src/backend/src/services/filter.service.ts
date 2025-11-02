import { Injectable, NotFoundException } from "@nestjs/common";
import { Filter, User } from "@prisma/client";

import { CreateFilterDto, FilterResponseDto, UpdateFilterDto } from "../dto";

import { PrismaService } from "./prisma.service";

@Injectable()
export class FilterService {
  constructor(private readonly prisma: PrismaService) {}

  async createFilter(
    user: User,
    data: CreateFilterDto,
  ): Promise<FilterResponseDto> {
    const filter = await this.prisma.filter.create({
      data: {
        title: data.title,
        icon: data.icon,
        minPrice: data.minPrice,
        maxPrice: data.maxPrice,
        dateFrom: data.dateFrom,
        dateTo: data.dateTo,
        searchText: data.searchText,
        transactionType: data.transactionType,
        sortOption: data.sortOption,
        user: { connect: { id: user.id } },
        filterCategories: data.categoryIds
          ? {
              create: data.categoryIds.map((id) => ({
                category: { connect: { id } },
              })),
            }
          : undefined,
      },
      include: { filterCategories: { select: { categoryId: true } } },
    });

    return FilterService.mapFilterToResponseDto(filter);
  }

  async getFilters(user: User): Promise<FilterResponseDto[]> {
    const filters = await this.prisma.filter.findMany({
      where: { userId: user.id },
      include: { filterCategories: { select: { categoryId: true } } },
      orderBy: { createdAt: "desc" },
    });

    return filters.map((f) => FilterService.mapFilterToResponseDto(f));
  }

  async deleteFilter(user: User, filterId: number): Promise<void> {
    const deleted = await this.prisma.filter.deleteMany({
      where: { id: filterId, userId: user.id },
    });

    if (!deleted.count) {
      throw new NotFoundException(
        "Filter not found or not authorized to delete",
      );
    }
  }

  async updateFilter(
    user: User,
    filterId: number,
    data: UpdateFilterDto,
  ): Promise<FilterResponseDto> {
    // Prepare data without categoryIds
    const { categoryIds, ...rest } = data as Partial<CreateFilterDto>;

    const updated = await this.prisma.filter.updateMany({
      where: { id: filterId, userId: user.id },
      data: rest,
    });

    if (!updated.count) {
      throw new NotFoundException(
        "Filter not found or not authorized to update",
      );
    }

    // If categoryIds provided replace join rows
    if (categoryIds !== undefined) {
      await this.prisma.filterCategory.deleteMany({ where: { filterId } });

      if (Array.isArray(categoryIds) && categoryIds.length) {
        await this.prisma.filterCategory.createMany({
          data: categoryIds.map((cid: number) => ({
            filterId,
            categoryId: cid,
          })),
          skipDuplicates: true,
        });
      }
    }

    const filter = await this.prisma.filter.findUnique({
      where: { id: filterId },
      include: { filterCategories: { select: { categoryId: true } } },
    });

    if (!filter) throw new NotFoundException("Filter not found after update");

    return FilterService.mapFilterToResponseDto(filter);
  }

  static mapFilterToResponseDto(
    filter: Filter & { filterCategories?: { categoryId: number }[] },
  ): FilterResponseDto {
    return {
      id: filter.id,
      title: filter.title,
      icon: filter.icon,
      minPrice: filter.minPrice,
      maxPrice: filter.maxPrice,
      dateFrom: filter.dateFrom,
      dateTo: filter.dateTo,
      searchText: filter.searchText,
      transactionType: filter.transactionType,
      sortOption: filter.sortOption,
      categoryIds: (filter.filterCategories || []).map((fc) => fc.categoryId),
      userId: filter.userId,
      createdAt: filter.createdAt,
      updatedAt: filter.updatedAt,
    };
  }
}
