import { NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";

import {
  CategorySortBy,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryPaginationParamsDto,
} from "../src/dto";
import { CategoryService } from "../src/services/category.service";
import { PrismaService } from "../src/services/prisma.service";

import {
  createMockCategory,
  createMockCategoryWithCount,
} from "./mock-data-factory";
import { createMockPrismaService } from "./prisma-mock-factory";
import { createTestModule } from "./test-helpers";

describe("CategoryService", () => {
  let service: CategoryService;
  let prismaService: jest.Mocked<PrismaService>;

  const userId = 1;
  const mockCategory = createMockCategory({ userId });

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await createTestModule({
      providers: [
        CategoryService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    });

    service = module.get<CategoryService>(CategoryService);
    prismaService = module.get<PrismaService>(
      PrismaService,
    ) as jest.Mocked<PrismaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createCategory", () => {
    const createDto: CreateCategoryDto = {
      name: "New Category",
      color: "Red",
      icon: "new-icon",
    };

    it("should create a category successfully", async () => {
      const createMock = jest.mocked(prismaService.category["create"]);
      const countMock = jest.mocked(prismaService.category["count"]);
      createMock.mockResolvedValue(mockCategory);
      countMock.mockResolvedValue(0);

      const result = await service.createCategory(userId, createDto);

      expect(createMock).toHaveBeenCalledWith({
        data: {
          ...createDto,
          userId,
        },
      });
      expect(result).toEqual({
        id: mockCategory.id,
        name: mockCategory.name,
        color: mockCategory.color,
        icon: mockCategory.icon,
        createdAt: mockCategory.createdAt,
        usageCount: 0,
      });
    });

    it("should return usage count as 0 for new category", async () => {
      const createMock = jest.mocked(prismaService.category["create"]);
      const transactionCountMock = jest.mocked(
        prismaService.transaction["count"],
      );
      createMock.mockResolvedValue(mockCategory);

      const result = await service.createCategory(userId, createDto);

      // createCategory always returns usageCount as 0 (hardcoded)
      expect(result.usageCount).toBe(0);
      expect(transactionCountMock).not.toHaveBeenCalled();
    });
  });

  describe("updateCategory", () => {
    const updateDto: UpdateCategoryDto = {
      name: "Updated Category",
      color: "Green",
    };

    it("should update category successfully", async () => {
      const findFirstMock = jest.mocked(prismaService.category["findFirst"]);
      const updateMock = jest.mocked(prismaService.category["update"]);
      const transactionCountMock = jest.mocked(
        prismaService.transaction["count"],
      );
      findFirstMock.mockResolvedValue(mockCategory);
      updateMock.mockResolvedValue({
        ...mockCategory,
        ...updateDto,
      });
      transactionCountMock.mockResolvedValue(3);

      const result = await service.updateCategory(userId, 1, updateDto);

      expect(findFirstMock).toHaveBeenCalledWith({
        where: { id: 1, userId },
      });
      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
      });
      expect(result.name).toBe(updateDto.name);
      expect(result.color).toBe(updateDto.color);
    });

    it("should throw NotFoundException if category not found", async () => {
      const findFirstMock = jest.mocked(prismaService.category["findFirst"]);
      const updateMock = jest.mocked(prismaService.category["update"]);
      findFirstMock.mockResolvedValue(null);

      await expect(
        service.updateCategory(userId, 999, updateDto),
      ).rejects.toThrow(NotFoundException);
      expect(updateMock).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if category belongs to different user", async () => {
      const findFirstMock = jest.mocked(prismaService.category["findFirst"]);
      findFirstMock.mockResolvedValue(null);

      await expect(
        service.updateCategory(userId, 1, updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("deleteCategory", () => {
    it("should delete category successfully", async () => {
      const findFirstMock = jest.mocked(prismaService.category["findFirst"]);
      const deleteMock = jest.mocked(prismaService.category["delete"]);
      findFirstMock.mockResolvedValue(mockCategory);
      deleteMock.mockResolvedValue(mockCategory);

      await service.deleteCategory(userId, 1);

      expect(findFirstMock).toHaveBeenCalledWith({
        where: { id: 1, userId },
      });
      expect(deleteMock).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should throw NotFoundException if category not found", async () => {
      const findFirstMock = jest.mocked(prismaService.category["findFirst"]);
      const deleteMock = jest.mocked(prismaService.category["delete"]);
      findFirstMock.mockResolvedValue(null);

      await expect(service.deleteCategory(userId, 999)).rejects.toThrow(
        NotFoundException,
      );
      expect(deleteMock).not.toHaveBeenCalled();
    });
  });

  describe("listCategories", () => {
    it("should list categories with default sorting", async () => {
      const mockCategories = [
        createMockCategoryWithCount({ id: 1, _count: { Transaction: 2 } }),
        createMockCategoryWithCount({
          id: 2,
          name: "Category 2",
          _count: { Transaction: 5 },
        }),
      ];

      const findManyMock = jest.mocked(prismaService.category["findMany"]);
      findManyMock.mockResolvedValue(mockCategories);

      const params: CategoryPaginationParamsDto = {
        take: 10,
        sortBy: CategorySortBy.CREATED_AT_DESC,
      };

      const result = await service.listCategories(userId, params);

      expect(findManyMock).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              Transaction: true,
            },
          },
        },
      });
      expect(result).toHaveLength(2);
      expect(result[0].usageCount).toBe(2);
      expect(result[1].usageCount).toBe(5);
    });

    it("should sort by usage count descending", async () => {
      const mockCategories = [
        createMockCategoryWithCount({ _count: { Transaction: 10 } }),
      ];

      const findManyMock = jest.mocked(prismaService.category["findMany"]);
      findManyMock.mockResolvedValue(mockCategories);

      const params: CategoryPaginationParamsDto = {
        take: 10,
        sortBy: CategorySortBy.USAGE_DESC,
      };

      await service.listCategories(userId, params);

      expect(findManyMock).toHaveBeenCalledWith({
        where: { userId },
        orderBy: {
          Transaction: {
            _count: "desc",
          },
        },
        include: {
          _count: {
            select: {
              Transaction: true,
            },
          },
        },
      });
    });

    it("should sort alphabetically ascending", async () => {
      const mockCategories = [
        createMockCategoryWithCount({ _count: { Transaction: 0 } }),
      ];

      const findManyMock = jest.mocked(prismaService.category["findMany"]);
      findManyMock.mockResolvedValue(mockCategories);

      const params: CategoryPaginationParamsDto = {
        take: 10,
        sortBy: CategorySortBy.ALPHA_ASC,
      };

      await service.listCategories(userId, params);

      expect(findManyMock).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: {
              Transaction: true,
            },
          },
        },
      });
    });

    it("should return empty array when no categories exist", async () => {
      const findManyMock = jest.mocked(prismaService.category["findMany"]);
      findManyMock.mockResolvedValue([]);

      const params: CategoryPaginationParamsDto = {
        take: 10,
        sortBy: CategorySortBy.CREATED_AT_DESC,
      };

      const result = await service.listCategories(userId, params);

      expect(result).toEqual([]);
    });

    it("should sort by CREATED_AT_ASC", async () => {
      const mockCategories = [
        createMockCategoryWithCount({ _count: { Transaction: 0 } }),
      ];

      const findManyMock = jest.mocked(prismaService.category["findMany"]);
      findManyMock.mockResolvedValue(mockCategories);

      const params: CategoryPaginationParamsDto = {
        take: 10,
        sortBy: CategorySortBy.CREATED_AT_ASC,
      };

      await service.listCategories(userId, params);

      expect(findManyMock).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: "asc" },
        include: {
          _count: {
            select: {
              Transaction: true,
            },
          },
        },
      });
    });

    it("should sort by CREATED_AT_DESC", async () => {
      const mockCategories = [
        createMockCategoryWithCount({ _count: { Transaction: 0 } }),
      ];

      const findManyMock = jest.mocked(prismaService.category["findMany"]);
      findManyMock.mockResolvedValue(mockCategories);

      const params: CategoryPaginationParamsDto = {
        take: 10,
        sortBy: CategorySortBy.CREATED_AT_DESC,
      };

      await service.listCategories(userId, params);

      expect(findManyMock).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              Transaction: true,
            },
          },
        },
      });
    });

    it("should sort by ALPHA_DESC", async () => {
      const mockCategories = [
        createMockCategoryWithCount({ _count: { Transaction: 0 } }),
      ];

      const findManyMock = jest.mocked(prismaService.category["findMany"]);
      findManyMock.mockResolvedValue(mockCategories);

      const params: CategoryPaginationParamsDto = {
        take: 10,
        sortBy: CategorySortBy.ALPHA_DESC,
      };

      await service.listCategories(userId, params);

      expect(findManyMock).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { name: "desc" },
        include: {
          _count: {
            select: {
              Transaction: true,
            },
          },
        },
      });
    });

    it("should default to CREATED_AT_DESC when sortBy is not provided", async () => {
      const mockCategories = [
        createMockCategoryWithCount({ _count: { Transaction: 0 } }),
      ];

      const findManyMock = jest.mocked(prismaService.category["findMany"]);
      findManyMock.mockResolvedValue(mockCategories);

      const params: CategoryPaginationParamsDto = {
        take: 10,
        sortBy: undefined as CategorySortBy | undefined,
      };

      await service.listCategories(userId, params);

      expect(findManyMock).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              Transaction: true,
            },
          },
        },
      });
    });
  });

  describe("createCategory - Edge Cases", () => {
    it("should create category with all required fields", async () => {
      const createDto: CreateCategoryDto = {
        name: "Test Category",
        color: "Blue",
        icon: "test-icon",
      };

      const createMock = jest.mocked(prismaService.category["create"]);
      const transactionCountMock = jest.mocked(
        prismaService.transaction["count"],
      );
      createMock.mockResolvedValue(mockCategory);
      transactionCountMock.mockResolvedValue(0);

      const result = await service.createCategory(userId, createDto);

      expect(result.name).toBe(createDto.name);
      expect(result.color).toBe(createDto.color);
      expect(result.icon).toBe(createDto.icon);
    });
  });

  describe("updateCategory - Edge Cases", () => {
    it("should update only provided fields", async () => {
      const partialUpdate: UpdateCategoryDto = {
        name: "Updated Name Only",
      };

      const findFirstMock = jest.mocked(prismaService.category["findFirst"]);
      const updateMock = jest.mocked(prismaService.category["update"]);
      const transactionCountMock = jest.mocked(
        prismaService.transaction["count"],
      );
      findFirstMock.mockResolvedValue(mockCategory);
      updateMock.mockResolvedValue({
        ...mockCategory,
        ...partialUpdate,
      });
      transactionCountMock.mockResolvedValue(0);

      const result = await service.updateCategory(userId, 1, partialUpdate);

      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 1 },
        data: partialUpdate,
      });
      expect(result.name).toBe(partialUpdate.name);
      expect(result.color).toBe(mockCategory.color); // Unchanged
    });
  });
});
