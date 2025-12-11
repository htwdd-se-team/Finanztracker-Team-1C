import { NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { TransactionType, FilterSortOption } from "@prisma/client";

import { CreateFilterDto, UpdateFilterDto } from "../src/dto";
import { FilterService } from "../src/services/filter.service";
import { PrismaService } from "../src/services/prisma.service";

import { createMockUser, createMockFilter } from "./mock-data-factory";
import { createMockPrismaService } from "./prisma-mock-factory";
import { createTestModule } from "./test-helpers";

describe("FilterService", () => {
  let service: FilterService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = createMockUser();
  const mockFilter = createMockFilter({ userId: mockUser.id });

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await createTestModule({
      providers: [
        FilterService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    });

    service = module.get<FilterService>(FilterService);
    prismaService = module.get<PrismaService>(
      PrismaService,
    ) as jest.Mocked<PrismaService>;
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
      const createdFilter = createMockFilter({
        title: createDto.title,
        icon: createDto.icon,
        minPrice: createDto.minPrice,
        maxPrice: createDto.maxPrice,
        transactionType: createDto.transactionType,
      });
      const createMock = jest.mocked(prismaService.filter["create"]);
      createMock.mockResolvedValue(createdFilter);

      const result = await service.createFilter(mockUser, createDto);

      expect(createMock).toHaveBeenCalledWith({
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

      const createMock = jest.mocked(prismaService.filter["create"]);
      createMock.mockResolvedValue(mockFilter);

      await service.createFilter(mockUser, dtoWithoutCategories);

      expect(createMock).toHaveBeenCalled();
      const callArgs = createMock.mock.calls[0];
      expect(callArgs).toBeDefined();
      if (
        callArgs &&
        callArgs[0] &&
        typeof callArgs[0] === "object" &&
        "data" in callArgs[0]
      ) {
        const data = callArgs[0].data as Record<string, unknown>;
        expect(data).not.toHaveProperty("filterCategories");
      }
      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { filterCategories: true },
        }),
      );
    });
  });

  describe("getFilters", () => {
    it("should return all filters for user", async () => {
      const mockFilters = [mockFilter];

      const findManyMock = jest.mocked(prismaService.filter["findMany"]);
      findManyMock.mockResolvedValue(mockFilters);

      const result = await service.getFilters(mockUser);

      expect(findManyMock).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: { filterCategories: true },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockFilter.id);
    });

    it("should return empty array when no filters exist", async () => {
      const findManyMock = jest.mocked(prismaService.filter["findMany"]);
      findManyMock.mockResolvedValue([]);

      const result = await service.getFilters(mockUser);

      expect(result).toEqual([]);
    });

    it("should include category IDs in response", async () => {
      const filterWithCategories = createMockFilter({
        filterCategories: [
          { categoryId: 1, filterId: 1 },
          { categoryId: 2, filterId: 1 },
        ],
      });

      const findManyMock = jest.mocked(prismaService.filter["findMany"]);
      findManyMock.mockResolvedValue([filterWithCategories]);

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
      const findUniqueMock = jest.mocked(prismaService.filter["findUnique"]);
      const updateMock = jest.mocked(prismaService.filter["update"]);
      findUniqueMock.mockResolvedValue(mockFilter);
      updateMock.mockResolvedValue({
        ...mockFilter,
        ...updateDto,
      });

      const result = await service.updateFilter(mockUser, 1, updateDto);

      expect(findUniqueMock).toHaveBeenCalledWith({
        where: { id: 1, userId: mockUser.id },
      });
      expect(updateMock).toHaveBeenCalledWith({
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

      const findUniqueMock = jest.mocked(prismaService.filter["findUnique"]);
      const updateMock = jest.mocked(prismaService.filter["update"]);
      findUniqueMock.mockResolvedValue(mockFilter);
      updateMock.mockResolvedValue(mockFilter);

      await service.updateFilter(mockUser, 1, updateWithCategories);

      expect(updateMock).toHaveBeenCalledWith({
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

      const findUniqueMock = jest.mocked(prismaService.filter["findUnique"]);
      const updateMock = jest.mocked(prismaService.filter["update"]);
      findUniqueMock.mockResolvedValue(mockFilter);
      updateMock.mockResolvedValue(mockFilter);

      await service.updateFilter(mockUser, 1, updateWithEmptyCategories);

      expect(updateMock).toHaveBeenCalledWith({
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
      const findUniqueMock = jest.mocked(prismaService.filter["findUnique"]);
      findUniqueMock.mockResolvedValue(null);

      await expect(
        service.updateFilter(mockUser, 999, updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("deleteFilter", () => {
    it("should delete filter successfully", async () => {
      const deleteManyMock = jest.mocked(prismaService.filter["deleteMany"]);
      deleteManyMock.mockResolvedValue({ count: 1 });

      await service.deleteFilter(mockUser, 1);

      expect(deleteManyMock).toHaveBeenCalledWith({
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

      const createMock = jest.mocked(prismaService.filter["create"]);
      createMock.mockResolvedValue(mockFilter);

      await service.createFilter(mockUser, completeDto);

      expect(createMock).toHaveBeenCalled();
      const callArgs = createMock.mock.calls[0];
      expect(callArgs).toBeDefined();
      if (callArgs && callArgs[0] && typeof callArgs[0] === "object") {
        const callData = callArgs[0] as {
          data: Record<string, unknown>;
          include: unknown;
        };
        expect(callData.data).toMatchObject({
          title: completeDto.title,
          icon: completeDto.icon,
          minPrice: completeDto.minPrice,
          maxPrice: completeDto.maxPrice,
          dateFrom: completeDto.dateFrom,
          dateTo: completeDto.dateTo,
          searchText: completeDto.searchText,
          transactionType: completeDto.transactionType,
          sortOption: completeDto.sortOption,
        });
        expect(callData.include).toEqual({ filterCategories: true });
      }
    });

    it("should create filter with minimal required fields", async () => {
      const minimalDto: CreateFilterDto = {
        title: "Minimal Filter",
      };

      const createMock = jest.mocked(prismaService.filter["create"]);
      createMock.mockResolvedValue(mockFilter);

      await service.createFilter(mockUser, minimalDto);

      expect(createMock).toHaveBeenCalled();
      const callArgs = createMock.mock.calls[0];
      expect(callArgs).toBeDefined();
      if (callArgs && callArgs[0] && typeof callArgs[0] === "object") {
        const callData = callArgs[0] as {
          data: Record<string, unknown>;
          include: unknown;
        };
        expect(callData.data).toMatchObject({
          title: minimalDto.title,
        });
        expect(callData.include).toEqual({ filterCategories: true });
      }
    });
  });

  describe("getFilters - Edge Cases", () => {
    it("should return filters ordered by createdAt desc", async () => {
      const olderFilter = createMockFilter({
        id: 1,
        createdAt: new Date("2024-01-01"),
      });
      const newerFilter = createMockFilter({
        id: 2,
        createdAt: new Date("2024-12-31"),
      });

      const findManyMock = jest.mocked(prismaService.filter["findMany"]);
      findManyMock.mockResolvedValue([newerFilter, olderFilter]);

      const result = await service.getFilters(mockUser);

      expect(findManyMock).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: { filterCategories: true },
        orderBy: { createdAt: "desc" },
      });
      expect(result[0].id).toBe(2); // Newer filter first
    });
  });
});
