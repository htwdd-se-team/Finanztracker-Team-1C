import { createMock } from "@golevelup/ts-jest";
import { NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { Category } from "@prisma/client";

import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryPaginationParamsDto,
  CategorySortBy,
} from "../src/dto";
import { CategoryService } from "../src/services/category.service";
import { PrismaService } from "../src/services/prisma.service";

import { createTestModule } from "./test-helpers";

describe("CategoryService", () => {
  let service: CategoryService;
  let module: TestingModule;
  let mockCategoryCreate: jest.Mock;
  let mockCategoryFindFirst: jest.Mock;
  let mockCategoryFindMany: jest.Mock;
  let mockCategoryUpdate: jest.Mock;
  let mockCategoryDelete: jest.Mock;
  let mockTransactionCount: jest.Mock;

  const mockUserId = 1;
  const mockCategory: Category = {
    id: 1,
    name: "Test Category",
    color: "Blue",
    icon: "shopping-cart",
    userId: mockUserId,
    createdAt: new Date("2024-01-01"),
  };

  beforeAll(async () => {
    mockCategoryCreate = jest.fn();
    mockCategoryFindFirst = jest.fn();
    mockCategoryFindMany = jest.fn();
    mockCategoryUpdate = jest.fn();
    mockCategoryDelete = jest.fn();
    mockTransactionCount = jest.fn();

    const mockPrismaService = createMock<PrismaService>({
      category: {
        create: mockCategoryCreate,
        findFirst: mockCategoryFindFirst,
        findMany: mockCategoryFindMany,
        update: mockCategoryUpdate,
        delete: mockCategoryDelete,
      },
      transaction: {
        count: mockTransactionCount,
      },
    } as unknown as PrismaService);

    module = await createTestModule({
      providers: [
        CategoryService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    });

    service = module.get<CategoryService>(CategoryService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createCategory", () => {
    it("should create a category successfully", async () => {
      const createDto: CreateCategoryDto = {
        name: "Test Category",
        color: "Blue",
        icon: "shopping-cart",
      };

      mockCategoryCreate.mockResolvedValue(mockCategory);
      mockTransactionCount.mockResolvedValue(0);

      const result = await service.createCategory(mockUserId, createDto);

      expect(result).toEqual({
        id: mockCategory.id,
        name: mockCategory.name,
        color: mockCategory.color,
        icon: mockCategory.icon,
        createdAt: mockCategory.createdAt,
        usageCount: 0,
      });
      expect(mockCategoryCreate).toHaveBeenCalledWith({
        data: {
          ...createDto,
          userId: mockUserId,
        },
      });
    });

    it("should return usage count as 0 for new category", async () => {
      const createDto: CreateCategoryDto = {
        name: "New Category",
        color: "Red",
        icon: "tag",
      };

      mockCategoryCreate.mockResolvedValue({
        ...mockCategory,
        name: "New Category",
        color: "Red",
        icon: "tag",
      });

      const result = await service.createCategory(mockUserId, createDto);

      expect(result.usageCount).toBe(0);
    });

    it("should create category with all required fields", async () => {
      const createDto: CreateCategoryDto = {
        name: "Required Category",
        color: "Green",
        icon: "check",
      };

      mockCategoryCreate.mockResolvedValue({
        ...mockCategory,
        ...createDto,
      });

      const result = await service.createCategory(mockUserId, createDto);

      expect(result.name).toBe(createDto.name);
      expect(result.color).toBe(createDto.color);
      expect(result.icon).toBe(createDto.icon);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
    });
  });

  describe("updateCategory", () => {
    it("should update category successfully", async () => {
      const updateDto: UpdateCategoryDto = {
        name: "Updated Category",
      };

      mockCategoryFindFirst.mockResolvedValue(mockCategory);
      mockCategoryUpdate.mockResolvedValue({
        ...mockCategory,
        ...updateDto,
      });
      mockTransactionCount.mockResolvedValue(5);

      const result = await service.updateCategory(
        mockUserId,
        mockCategory.id,
        updateDto,
      );

      expect(result.name).toBe("Updated Category");
      expect(result.usageCount).toBe(5);
      expect(mockCategoryFindFirst).toHaveBeenCalledWith({
        where: { id: mockCategory.id, userId: mockUserId },
      });
      expect(mockCategoryUpdate).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
        data: updateDto,
      });
    });

    it("should throw NotFoundException if category not found", async () => {
      mockCategoryFindFirst.mockResolvedValue(null);

      await expect(
        service.updateCategory(mockUserId, 999, { name: "Updated" }),
      ).rejects.toThrow(NotFoundException);
      expect(mockCategoryUpdate).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if category belongs to different user", async () => {
      mockCategoryFindFirst.mockResolvedValue(null);

      await expect(
        service.updateCategory(999, mockCategory.id, { name: "Updated" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should update only provided fields", async () => {
      const updateDto: UpdateCategoryDto = {
        color: "Yellow",
      };

      mockCategoryFindFirst.mockResolvedValue(mockCategory);
      mockCategoryUpdate.mockResolvedValue({
        ...mockCategory,
        color: "Yellow",
      });
      mockTransactionCount.mockResolvedValue(0);

      const result = await service.updateCategory(
        mockUserId,
        mockCategory.id,
        updateDto,
      );

      expect(result.color).toBe("Yellow");
      expect(result.name).toBe(mockCategory.name);
      expect(mockCategoryUpdate).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
        data: updateDto,
      });
    });
  });

  describe("deleteCategory", () => {
    it("should delete category successfully", async () => {
      mockCategoryFindFirst.mockResolvedValue(mockCategory);
      mockCategoryDelete.mockResolvedValue(mockCategory);

      await service.deleteCategory(mockUserId, mockCategory.id);

      expect(mockCategoryFindFirst).toHaveBeenCalledWith({
        where: { id: mockCategory.id, userId: mockUserId },
      });
      expect(mockCategoryDelete).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
      });
    });

    it("should throw NotFoundException if category not found", async () => {
      mockCategoryFindFirst.mockResolvedValue(null);

      await expect(service.deleteCategory(mockUserId, 999)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockCategoryDelete).not.toHaveBeenCalled();
    });
  });

  describe("listCategories", () => {
    const mockCategories: (Category & { _count?: { Transaction: number } })[] =
      [
        {
          ...mockCategory,
          id: 1,
          name: "Category A",
          createdAt: new Date("2024-01-01"),
          _count: { Transaction: 5 },
        },
        {
          ...mockCategory,
          id: 2,
          name: "Category B",
          createdAt: new Date("2024-01-02"),
          _count: { Transaction: 3 },
        },
        {
          ...mockCategory,
          id: 3,
          name: "Category C",
          createdAt: new Date("2024-01-03"),
          _count: { Transaction: 10 },
        },
      ];

    it("should list categories with default sorting", async () => {
      const params: CategoryPaginationParamsDto = { take: 10 };

      mockCategoryFindMany.mockResolvedValue(mockCategories);

      const result = await service.listCategories(mockUserId, params);

      expect(result).toHaveLength(3);
      expect(mockCategoryFindMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
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

    it("should sort by usage count descending", async () => {
      const params: CategoryPaginationParamsDto = {
        take: 10,
        sortBy: CategorySortBy.USAGE_DESC,
      };

      mockCategoryFindMany.mockResolvedValue(mockCategories);

      await service.listCategories(mockUserId, params);

      expect(mockCategoryFindMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
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
      const params: CategoryPaginationParamsDto = {
        take: 10,
        sortBy: CategorySortBy.ALPHA_ASC,
      };

      mockCategoryFindMany.mockResolvedValue(mockCategories);

      await service.listCategories(mockUserId, params);

      expect(mockCategoryFindMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
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
      const params: CategoryPaginationParamsDto = { take: 10 };

      mockCategoryFindMany.mockResolvedValue([]);

      const result = await service.listCategories(mockUserId, params);

      expect(result).toEqual([]);
    });

    it("should sort by CREATED_AT_ASC", async () => {
      const params: CategoryPaginationParamsDto = {
        take: 10,
        sortBy: CategorySortBy.CREATED_AT_ASC,
      };

      mockCategoryFindMany.mockResolvedValue(mockCategories);

      await service.listCategories(mockUserId, params);

      expect(mockCategoryFindMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
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
      const params: CategoryPaginationParamsDto = {
        take: 10,
        sortBy: CategorySortBy.CREATED_AT_DESC,
      };

      mockCategoryFindMany.mockResolvedValue(mockCategories);

      await service.listCategories(mockUserId, params);

      expect(mockCategoryFindMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
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
      const params: CategoryPaginationParamsDto = {
        take: 10,
        sortBy: CategorySortBy.ALPHA_DESC,
      };

      mockCategoryFindMany.mockResolvedValue(mockCategories);

      await service.listCategories(mockUserId, params);

      expect(mockCategoryFindMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
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
      const params: CategoryPaginationParamsDto = { take: 10 };

      mockCategoryFindMany.mockResolvedValue(mockCategories);

      await service.listCategories(mockUserId, params);

      expect(mockCategoryFindMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
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

    it("should include category IDs in response", async () => {
      const params: CategoryPaginationParamsDto = { take: 10 };

      mockCategoryFindMany.mockResolvedValue(mockCategories);

      const result = await service.listCategories(mockUserId, params);

      expect(result[0].id).toBeDefined();
      expect(result[0].usageCount).toBe(5);
      expect(result[1].usageCount).toBe(3);
      expect(result[2].usageCount).toBe(10);
    });
  });
});
