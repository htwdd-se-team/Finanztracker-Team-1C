import { Injectable, NotFoundException } from "@nestjs/common";
import { Filter, FilterCategory, User } from "@prisma/client";

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
        ...(data.categoryIds && {
          filterCategories: {
            create: data.categoryIds.map((id) => ({
              category: { connect: { id } },
            })),
          },
        }),
      },
      include: { filterCategories: true },
    });

    return FilterService.mapFilterToResponseDto(filter);
  }

  async getFilters(user: User): Promise<FilterResponseDto[]> {
    const filters = await this.prisma.filter.findMany({
      where: { userId: user.id },
      include: { filterCategories: true },
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
    const { categoryIds, ...rest } = data as Partial<CreateFilterDto>;

    const filter = await this.prisma.filter.update({
      where: { id: filterId, userId: user.id },
      data: {
        ...rest,
        ...(categoryIds !== undefined && {
          filterCategories: {
            deleteMany: {},
            ...(categoryIds.length > 0 && {
              create: categoryIds.map((cid: number) => ({
                category: { connect: { id: cid } },
              })),
            }),
          },
        }),
      },
      include: { filterCategories: true },
    });

    if (!filter) {
      throw new NotFoundException(
        "Filter not found or not authorized to update",
      );
    }

    return FilterService.mapFilterToResponseDto(filter);
  }

  static mapFilterToResponseDto(
    filter: Filter & { filterCategories?: FilterCategory[] },
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
      createdAt: filter.createdAt,
      updatedAt: filter.updatedAt,
    };
  }
}
