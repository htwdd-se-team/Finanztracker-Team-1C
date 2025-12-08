import { NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { Category } from "@prisma/client";

import {
  CategorySortBy,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryPaginationParamsDto,
} from "../src/dto";
import { CategoryService } from "../src/services/category.service";
import { PrismaService } from "../src/services/prisma.service";

import { createTestModule } from "./test-helpers";

describe("CategoryService", () => {
  let service: CategoryService;
  let prismaService: PrismaService;

  const userId = 1;
  const mockCategory: Category = {
    id: 1,
    name: "Test Category",
    color: "Blue",
    icon: "test-icon",
    userId,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await createTestModule({
      providers: [
        CategoryService,
        {
          provide: PrismaService,
          useValue: {
            category: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            transaction: {
              count: jest.fn(),
            },
          },
        },
      ],
    });

    service = module.get<CategoryService>(CategoryService);
    prismaService = module.get<PrismaService>(PrismaService);
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
      jest
        .spyOn(prismaService.category, "create")
        .mockResolvedValue(mockCategory);
      jest.spyOn(prismaService.category, "count").mockResolvedValue(0);

      const result = await service.createCategory(userId, createDto);

      expect(prismaService.category.create).toHaveBeenCalledWith({
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
      jest
        .spyOn(prismaService.category, "create")
        .mockResolvedValue(mockCategory);

      const result = await service.createCategory(userId, createDto);

      // createCategory always returns usageCount as 0 (hardcoded)
      expect(result.usageCount).toBe(0);
      expect(prismaService.transaction.count).not.toHaveBeenCalled();
    });
  });

  describe("updateCategory", () => {
    const updateDto: UpdateCategoryDto = {
      name: "Updated Category",
      color: "Green",
    };

    it("should update category successfully", async () => {
      jest
        .spyOn(prismaService.category, "findFirst")
        .mockResolvedValue(mockCategory);
      jest
        .spyOn(prismaService.category, "update")
        .mockResolvedValue({ ...mockCategory, ...updateDto });
      jest.spyOn(prismaService.transaction, "count").mockResolvedValue(3);

      const result = await service.updateCategory(userId, 1, updateDto);

      expect(prismaService.category.findFirst).toHaveBeenCalledWith({
        where: { id: 1, userId },
      });
      expect(prismaService.category.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
      });
      expect(result.name).toBe(updateDto.name);
      expect(result.color).toBe(updateDto.color);
    });

    it("should throw NotFoundException if category not found", async () => {
      jest.spyOn(prismaService.category, "findFirst").mockResolvedValue(null);

      await expect(
        service.updateCategory(userId, 999, updateDto),
      ).rejects.toThrow(NotFoundException);
      expect(prismaService.category.update).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if category belongs to different user", async () => {
      jest.spyOn(prismaService.category, "findFirst").mockResolvedValue(null);

      await expect(
        service.updateCategory(userId, 1, updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("deleteCategory", () => {
    it("should delete category successfully", async () => {
      jest
        .spyOn(prismaService.category, "findFirst")
        .mockResolvedValue(mockCategory);
      jest
        .spyOn(prismaService.category, "delete")
        .mockResolvedValue(mockCategory);

      await service.deleteCategory(userId, 1);

      expect(prismaService.category.findFirst).toHaveBeenCalledWith({
        where: { id: 1, userId },
      });
      expect(prismaService.category.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should throw NotFoundException if category not found", async () => {
      jest.spyOn(prismaService.category, "findFirst").mockResolvedValue(null);

      await expect(service.deleteCategory(userId, 999)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.category.delete).not.toHaveBeenCalled();
    });
  });

  describe("listCategories", () => {
    it("should list categories with default sorting", async () => {
      const mockCategories = [
        { ...mockCategory, _count: { Transaction: 2 } },
        {
          ...mockCategory,
          id: 2,
          name: "Category 2",
          _count: { Transaction: 5 },
        },
      ];

      jest
        .spyOn(prismaService.category, "findMany")
        .mockResolvedValue(mockCategories as any);

      const params: CategoryPaginationParamsDto = {
        take: 10,
        sortBy: CategorySortBy.CREATED_AT_DESC,
      };

      const result = await service.listCategories(userId, params);

      expect(prismaService.category.findMany).toHaveBeenCalledWith({
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
      const mockCategories = [{ ...mockCategory, _count: { Transaction: 10 } }];

      jest
        .spyOn(prismaService.category, "findMany")
        .mockResolvedValue(mockCategories as any);

      const params: CategoryPaginationParamsDto = {
        take: 10,
        sortBy: CategorySortBy.USAGE_DESC,
      };

      await service.listCategories(userId, params);

      expect(prismaService.category.findMany).toHaveBeenCalledWith({
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
      const mockCategories = [{ ...mockCategory, _count: { Transaction: 0 } }];

      jest
        .spyOn(prismaService.category, "findMany")
        .mockResolvedValue(mockCategories as any);

      const params: CategoryPaginationParamsDto = {
        take: 10,
        sortBy: CategorySortBy.ALPHA_ASC,
      };

      await service.listCategories(userId, params);

      expect(prismaService.category.findMany).toHaveBeenCalledWith({
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
      jest.spyOn(prismaService.category, "findMany").mockResolvedValue([]);

      const params: CategoryPaginationParamsDto = {
        take: 10,
        sortBy: CategorySortBy.CREATED_AT_DESC,
      };

      const result = await service.listCategories(userId, params);

      expect(result).toEqual([]);
    });

    it("should sort by CREATED_AT_ASC", async () => {
      const mockCategories = [{ ...mockCategory, _count: { Transaction: 0 } }];

      jest
        .spyOn(prismaService.category, "findMany")
        .mockResolvedValue(mockCategories as any);

      const params: CategoryPaginationParamsDto = {
        take: 10,
        sortBy: CategorySortBy.CREATED_AT_ASC,
      };

      await service.listCategories(userId, params);

      expect(prismaService.category.findMany).toHaveBeenCalledWith({
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
      const mockCategories = [{ ...mockCategory, _count: { Transaction: 0 } }];

      jest
        .spyOn(prismaService.category, "findMany")
        .mockResolvedValue(mockCategories as any);

      const params: CategoryPaginationParamsDto = {
        take: 10,
        sortBy: CategorySortBy.CREATED_AT_DESC,
      };

      await service.listCategories(userId, params);

      expect(prismaService.category.findMany).toHaveBeenCalledWith({
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
      const mockCategories = [{ ...mockCategory, _count: { Transaction: 0 } }];

      jest
        .spyOn(prismaService.category, "findMany")
        .mockResolvedValue(mockCategories as any);

      const params: CategoryPaginationParamsDto = {
        take: 10,
        sortBy: CategorySortBy.ALPHA_DESC,
      };

      await service.listCategories(userId, params);

      expect(prismaService.category.findMany).toHaveBeenCalledWith({
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
      const mockCategories = [{ ...mockCategory, _count: { Transaction: 0 } }];

      jest
        .spyOn(prismaService.category, "findMany")
        .mockResolvedValue(mockCategories as any);

      const params: CategoryPaginationParamsDto = {
        take: 10,
        sortBy: undefined as any,
      };

      await service.listCategories(userId, params);

      expect(prismaService.category.findMany).toHaveBeenCalledWith({
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

      jest
        .spyOn(prismaService.category, "create")
        .mockResolvedValue(mockCategory);
      jest.spyOn(prismaService.transaction, "count").mockResolvedValue(0);

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

      jest
        .spyOn(prismaService.category, "findFirst")
        .mockResolvedValue(mockCategory);
      jest
        .spyOn(prismaService.category, "update")
        .mockResolvedValue({ ...mockCategory, ...partialUpdate });
      jest.spyOn(prismaService.transaction, "count").mockResolvedValue(0);

      const result = await service.updateCategory(userId, 1, partialUpdate);

      expect(prismaService.category.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: partialUpdate,
      });
      expect(result.name).toBe(partialUpdate.name);
      expect(result.color).toBe(mockCategory.color); // Unchanged
    });
  });
});
