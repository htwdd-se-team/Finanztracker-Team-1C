import { createMock } from "@golevelup/ts-jest";
import { NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { Filter, FilterCategory, User } from "@prisma/client";

import { CreateFilterDto, UpdateFilterDto } from "../src/dto";
import { FilterService } from "../src/services/filter.service";
import { PrismaService } from "../src/services/prisma.service";

import { createTestModule } from "./test-helpers";

describe("FilterService", () => {
  let service: FilterService;
  let module: TestingModule;
  let mockFilterCreate: jest.Mock;
  let mockFilterFindMany: jest.Mock;
  let mockFilterFindUnique: jest.Mock;
  let mockFilterUpdate: jest.Mock;
  let mockFilterDeleteMany: jest.Mock;

  const mockUser: User = {
    id: 1,
    email: "test@example.com",
    passwordHash: "hashed",
    givenName: "Test",
    familyName: "User",
    emergencyReserve: 100000,
    createdAt: new Date("2024-01-01"),
  };

  const mockFilter: Filter & { filterCategories?: FilterCategory[] } = {
    id: 1,
    title: "Test Filter",
    icon: "filter",
    minPrice: null,
    maxPrice: null,
    dateFrom: null,
    dateTo: null,
    searchText: null,
    transactionType: null,
    sortOption: null,
    userId: mockUser.id,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    filterCategories: [],
  };

  beforeAll(async () => {
    mockFilterCreate = jest.fn();
    mockFilterFindMany = jest.fn();
    mockFilterFindUnique = jest.fn();
    mockFilterUpdate = jest.fn();
    mockFilterDeleteMany = jest.fn();

    const mockPrismaService = createMock<PrismaService>({
      filter: {
        create: mockFilterCreate,
        findMany: mockFilterFindMany,
        findUnique: mockFilterFindUnique,
        update: mockFilterUpdate,
        deleteMany: mockFilterDeleteMany,
      },
    } as unknown as PrismaService);

    module = await createTestModule({
      providers: [
        FilterService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    });

    service = module.get<FilterService>(FilterService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createFilter", () => {
    it("should create filter successfully", async () => {
      const createDto: CreateFilterDto = {
        title: "Test Filter",
        icon: "filter",
        categoryIds: [1, 2],
      };

      const createdFilter = {
        ...mockFilter,
        filterCategories: [
          { filterId: 1, categoryId: 1 },
          { filterId: 1, categoryId: 2 },
        ] as FilterCategory[],
      };

      mockFilterCreate.mockResolvedValue(createdFilter);

      const result = await service.createFilter(mockUser, createDto);

      expect(result.title).toBe("Test Filter");
      expect(result.categoryIds).toEqual([1, 2]);
      expect(mockFilterCreate).toHaveBeenCalledWith({
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
    });

    it("should create filter without category IDs", async () => {
      const createDto: CreateFilterDto = {
        title: "Simple Filter",
      };

      mockFilterCreate.mockResolvedValue({
        ...mockFilter,
        title: "Simple Filter",
      });

      const result = await service.createFilter(mockUser, createDto);

      expect(result.title).toBe("Simple Filter");
      expect(result.categoryIds).toEqual([]);
      expect(mockFilterCreate).toHaveBeenCalledWith({
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
        },
        include: { filterCategories: true },
      });
    });

    it("should create filter with all optional fields", async () => {
      const createDto: CreateFilterDto = {
        title: "Complete Filter",
        icon: "star",
        minPrice: 1000,
        maxPrice: 5000,
        dateFrom: new Date("2024-01-01"),
        dateTo: new Date("2024-12-31"),
        searchText: "test",
        categoryIds: [1],
      };

      const createdFilter = {
        ...mockFilter,
        ...createDto,
        filterCategories: [{ filterId: 1, categoryId: 1 }] as FilterCategory[],
      };

      mockFilterCreate.mockResolvedValue(createdFilter);

      const result = await service.createFilter(mockUser, createDto);

      expect(result.title).toBe("Complete Filter");
      expect(result.minPrice).toBe(1000);
      expect(result.maxPrice).toBe(5000);
      expect(result.searchText).toBe("test");
    });

    it("should create filter with minimal required fields", async () => {
      const createDto: CreateFilterDto = {
        title: "Minimal Filter",
      };

      mockFilterCreate.mockResolvedValue({
        ...mockFilter,
        title: "Minimal Filter",
      });

      const result = await service.createFilter(mockUser, createDto);

      expect(result.title).toBe("Minimal Filter");
      expect(result.id).toBeDefined();
    });
  });

  describe("getFilters", () => {
    it("should return all filters for user", async () => {
      const filters = [
        { ...mockFilter, id: 1, title: "Filter 1" },
        { ...mockFilter, id: 2, title: "Filter 2" },
      ];

      mockFilterFindMany.mockResolvedValue(filters);

      const result = await service.getFilters(mockUser);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("Filter 1");
      expect(result[1].title).toBe("Filter 2");
      expect(mockFilterFindMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: { filterCategories: true },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return empty array when no filters exist", async () => {
      mockFilterFindMany.mockResolvedValue([]);

      const result = await service.getFilters(mockUser);

      expect(result).toEqual([]);
    });

    it("should include category IDs in response", async () => {
      const filters = [
        {
          ...mockFilter,
          filterCategories: [
            { filterId: 1, categoryId: 1 },
            { filterId: 1, categoryId: 2 },
          ] as unknown as FilterCategory[],
        },
      ];

      mockFilterFindMany.mockResolvedValue(filters);

      const result = await service.getFilters(mockUser);

      expect(result[0].categoryIds).toEqual([1, 2]);
    });

    it("should return filters ordered by createdAt desc", async () => {
      const filters = [
        { ...mockFilter, id: 1, createdAt: new Date("2024-01-02") },
        { ...mockFilter, id: 2, createdAt: new Date("2024-01-01") },
      ];

      mockFilterFindMany.mockResolvedValue(filters);

      await service.getFilters(mockUser);

      expect(mockFilterFindMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: { filterCategories: true },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("updateFilter", () => {
    it("should update filter successfully", async () => {
      const updateDto: UpdateFilterDto = {
        title: "Updated Filter",
      };

      mockFilterFindUnique.mockResolvedValue(mockFilter);
      mockFilterUpdate.mockResolvedValue({
        ...mockFilter,
        title: "Updated Filter",
      });

      const result = await service.updateFilter(mockUser, 1, updateDto);

      expect(result.title).toBe("Updated Filter");
      expect(mockFilterFindUnique).toHaveBeenCalledWith({
        where: { id: 1, userId: mockUser.id },
      });
      expect(mockFilterUpdate).toHaveBeenCalledWith({
        where: { id: 1, userId: mockUser.id },
        data: {
          title: "Updated Filter",
        },
        include: { filterCategories: true },
      });
    });

    it("should update category IDs", async () => {
      const updateDto: UpdateFilterDto = {
        categoryIds: [3, 4],
      };

      mockFilterFindUnique.mockResolvedValue(mockFilter);
      mockFilterUpdate.mockResolvedValue({
        ...mockFilter,
        filterCategories: [
          { filterId: 1, categoryId: 3 },
          { filterId: 1, categoryId: 4 },
        ] as unknown as FilterCategory[],
      });

      const result = await service.updateFilter(mockUser, 1, updateDto);

      expect(result.categoryIds).toEqual([3, 4]);
      expect(mockFilterUpdate).toHaveBeenCalledWith({
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
      const updateDto: UpdateFilterDto = {
        categoryIds: [],
      };

      mockFilterFindUnique.mockResolvedValue(mockFilter);
      mockFilterUpdate.mockResolvedValue({
        ...mockFilter,
        filterCategories: [],
      });

      const result = await service.updateFilter(mockUser, 1, updateDto);

      expect(result.categoryIds).toEqual([]);
      expect(mockFilterUpdate).toHaveBeenCalledWith({
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
      mockFilterFindUnique.mockResolvedValue(null);

      await expect(
        service.updateFilter(mockUser, 999, { title: "Updated" }),
      ).rejects.toThrow(NotFoundException);
      expect(mockFilterUpdate).not.toHaveBeenCalled();
    });
  });

  describe("deleteFilter", () => {
    it("should delete filter successfully", async () => {
      mockFilterDeleteMany.mockResolvedValue({ count: 1 });

      await service.deleteFilter(mockUser, 1);

      expect(mockFilterDeleteMany).toHaveBeenCalledWith({
        where: { id: 1, userId: mockUser.id },
      });
    });

    it("should throw NotFoundException if filter not found", async () => {
      mockFilterDeleteMany.mockResolvedValue({ count: 0 });

      await expect(service.deleteFilter(mockUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException if filter belongs to different user", async () => {
      mockFilterDeleteMany.mockResolvedValue({ count: 0 });

      await expect(service.deleteFilter(mockUser, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
