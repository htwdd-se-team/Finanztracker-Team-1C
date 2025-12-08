import { NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import {
  Filter,
  FilterCategory,
  User,
  TransactionType,
  FilterSortOption,
} from "@prisma/client";

import { CreateFilterDto, UpdateFilterDto } from "../src/dto";
import { FilterService } from "../src/services/filter.service";
import { PrismaService } from "../src/services/prisma.service";

import { createTestModule } from "./test-helpers";

describe("FilterService", () => {
  let service: FilterService;
  let prismaService: PrismaService;

  const mockUser: User = {
    id: 1,
    email: "test@example.com",
    passwordHash: "hashedPassword",
    givenName: "Test",
    familyName: "User",
    createdAt: new Date(),
  };

  const mockFilter: Filter & { filterCategories: FilterCategory[] } = {
    id: 1,
    title: "Test Filter",
    icon: "test-icon",
    minPrice: 1000,
    maxPrice: 5000,
    dateFrom: null,
    dateTo: null,
    searchText: "test",
    transactionType: TransactionType.EXPENSE,
    sortOption: null,
    userId: mockUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    filterCategories: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await createTestModule({
      providers: [
        FilterService,
        {
          provide: PrismaService,
          useValue: {
            filter: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
      ],
    });

    service = module.get<FilterService>(FilterService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createFilter", () => {
    const createDto: CreateFilterDto = {
      title: "New Filter",
      icon: "new-icon",
      minPrice: 1000,
      maxPrice: 5000,
      transactionType: TransactionType.EXPENSE,
      categoryIds: [1, 2],
    };

    it("should create filter successfully", async () => {
      const createdFilter = {
        ...mockFilter,
        title: createDto.title,
        icon: createDto.icon,
        minPrice: createDto.minPrice,
        maxPrice: createDto.maxPrice,
        transactionType: createDto.transactionType,
      };
      jest
        .spyOn(prismaService.filter, "create")
        .mockResolvedValue(createdFilter as any);

      const result = await service.createFilter(mockUser, createDto);

      expect(prismaService.filter.create).toHaveBeenCalledWith({
        data: {
          title: createDto.title,
          icon: createDto.icon,
          minPrice: createDto.minPrice,
          maxPrice: createDto.maxPrice,
          dateFrom: createDto.dateFrom,
          dateTo: createDto.dateTo,
          searchText: createDto.searchText,
          transactionType: createDto.transactionType,
          sortOption: createDto.sortOption,
          user: { connect: { id: mockUser.id } },
          filterCategories: {
            create: [
              { category: { connect: { id: 1 } } },
              { category: { connect: { id: 2 } } },
            ],
          },
        },
        include: { filterCategories: true },
      });
      expect(result.id).toBe(createdFilter.id);
      expect(result.title).toBe(createDto.title);
    });

    it("should create filter without category IDs", async () => {
      const dtoWithoutCategories: CreateFilterDto = {
        title: "Filter without categories",
      };

      jest.spyOn(prismaService.filter, "create").mockResolvedValue(mockFilter);

      await service.createFilter(mockUser, dtoWithoutCategories);

      expect(prismaService.filter.create).toHaveBeenCalledWith({
        data: expect.not.objectContaining({
          filterCategories: expect.anything(),
        }),
        include: { filterCategories: true },
      });
    });
  });

  describe("getFilters", () => {
    it("should return all filters for user", async () => {
      const mockFilters = [mockFilter];

      jest
        .spyOn(prismaService.filter, "findMany")
        .mockResolvedValue(mockFilters as any);

      const result = await service.getFilters(mockUser);

      expect(prismaService.filter.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: { filterCategories: true },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockFilter.id);
    });

    it("should return empty array when no filters exist", async () => {
      jest.spyOn(prismaService.filter, "findMany").mockResolvedValue([]);

      const result = await service.getFilters(mockUser);

      expect(result).toEqual([]);
    });

    it("should include category IDs in response", async () => {
      const filterWithCategories = {
        ...mockFilter,
        filterCategories: [
          { categoryId: 1 },
          { categoryId: 2 },
        ] as FilterCategory[],
      };

      jest
        .spyOn(prismaService.filter, "findMany")
        .mockResolvedValue([filterWithCategories] as any);

      const result = await service.getFilters(mockUser);

      expect(result[0].categoryIds).toEqual([1, 2]);
    });
  });

  describe("updateFilter", () => {
    const updateDto: UpdateFilterDto = {
      title: "Updated Filter",
      minPrice: 2000,
    };

    it("should update filter successfully", async () => {
      jest
        .spyOn(prismaService.filter, "findUnique")
        .mockResolvedValue(mockFilter);
      jest
        .spyOn(prismaService.filter, "update")
        .mockResolvedValue({ ...mockFilter, ...updateDto } as any);

      const result = await service.updateFilter(mockUser, 1, updateDto);

      expect(prismaService.filter.findUnique).toHaveBeenCalledWith({
        where: { id: 1, userId: mockUser.id },
      });
      expect(prismaService.filter.update).toHaveBeenCalledWith({
        where: { id: 1, userId: mockUser.id },
        data: updateDto,
        include: { filterCategories: true },
      });
      expect(result.title).toBe(updateDto.title);
    });

    it("should update category IDs", async () => {
      const updateWithCategories: UpdateFilterDto = {
        categoryIds: [3, 4],
      };

      jest
        .spyOn(prismaService.filter, "findUnique")
        .mockResolvedValue(mockFilter);
      jest
        .spyOn(prismaService.filter, "update")
        .mockResolvedValue(mockFilter as any);

      await service.updateFilter(mockUser, 1, updateWithCategories);

      expect(prismaService.filter.update).toHaveBeenCalledWith({
        where: { id: 1, userId: mockUser.id },
        data: {
          filterCategories: {
            deleteMany: {},
            create: [
              { category: { connect: { id: 3 } } },
              { category: { connect: { id: 4 } } },
            ],
          },
        },
        include: { filterCategories: true },
      });
    });

    it("should clear category IDs when empty array provided", async () => {
      const updateWithEmptyCategories: UpdateFilterDto = {
        categoryIds: [],
      };

      jest
        .spyOn(prismaService.filter, "findUnique")
        .mockResolvedValue(mockFilter);
      jest
        .spyOn(prismaService.filter, "update")
        .mockResolvedValue(mockFilter as any);

      await service.updateFilter(mockUser, 1, updateWithEmptyCategories);

      expect(prismaService.filter.update).toHaveBeenCalledWith({
        where: { id: 1, userId: mockUser.id },
        data: {
          filterCategories: {
            deleteMany: {},
          },
        },
        include: { filterCategories: true },
      });
    });

    it("should throw NotFoundException if filter not found", async () => {
      jest.spyOn(prismaService.filter, "findUnique").mockResolvedValue(null);

      await expect(
        service.updateFilter(mockUser, 999, updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("deleteFilter", () => {
    it("should delete filter successfully", async () => {
      jest
        .spyOn(prismaService.filter, "deleteMany")
        .mockResolvedValue({ count: 1 });

      await service.deleteFilter(mockUser, 1);

      expect(prismaService.filter.deleteMany).toHaveBeenCalledWith({
        where: { id: 1, userId: mockUser.id },
      });
    });

    it("should throw NotFoundException if filter not found", async () => {
      jest
        .spyOn(prismaService.filter, "deleteMany")
        .mockResolvedValue({ count: 0 });

      await expect(service.deleteFilter(mockUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException if filter belongs to different user", async () => {
      jest
        .spyOn(prismaService.filter, "deleteMany")
        .mockResolvedValue({ count: 0 });

      await expect(service.deleteFilter(mockUser, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("createFilter - Edge Cases", () => {
    it("should create filter with all optional fields", async () => {
      const completeDto: CreateFilterDto = {
        title: "Complete Filter",
        icon: "icon",
        minPrice: 1000,
        maxPrice: 5000,
        dateFrom: new Date("2024-01-01"),
        dateTo: new Date("2024-12-31"),
        searchText: "search",
        transactionType: TransactionType.EXPENSE,
        sortOption: FilterSortOption.HIGHEST_AMOUNT,
        categoryIds: [1, 2, 3],
      };

      jest.spyOn(prismaService.filter, "create").mockResolvedValue(mockFilter);

      await service.createFilter(mockUser, completeDto);

      expect(prismaService.filter.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: completeDto.title,
          icon: completeDto.icon,
          minPrice: completeDto.minPrice,
          maxPrice: completeDto.maxPrice,
          dateFrom: completeDto.dateFrom,
          dateTo: completeDto.dateTo,
          searchText: completeDto.searchText,
          transactionType: completeDto.transactionType,
          sortOption: completeDto.sortOption,
        }),
        include: { filterCategories: true },
      });
    });

    it("should create filter with minimal required fields", async () => {
      const minimalDto: CreateFilterDto = {
        title: "Minimal Filter",
      };

      jest.spyOn(prismaService.filter, "create").mockResolvedValue(mockFilter);

      await service.createFilter(mockUser, minimalDto);

      expect(prismaService.filter.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: minimalDto.title,
        }),
        include: { filterCategories: true },
      });
    });
  });

  describe("getFilters - Edge Cases", () => {
    it("should return filters ordered by createdAt desc", async () => {
      const olderFilter = {
        ...mockFilter,
        id: 1,
        createdAt: new Date("2024-01-01"),
      };
      const newerFilter = {
        ...mockFilter,
        id: 2,
        createdAt: new Date("2024-12-31"),
      };

      jest
        .spyOn(prismaService.filter, "findMany")
        .mockResolvedValue([newerFilter, olderFilter] as any);

      const result = await service.getFilters(mockUser);

      expect(prismaService.filter.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: { filterCategories: true },
        orderBy: { createdAt: "desc" },
      });
      expect(result[0].id).toBe(2); // Newer filter first
    });
  });
});
