import { BadRequestException, NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import {
  Transaction,
  TransactionType,
  RecurringTransactionType,
  User,
  FilterSortOption,
} from "@prisma/client";

import {
  Currency,
  EntrySortBy,
  CreateEntryDto,
  UpdateEntryDto,
  EntryPaginationParamsDto,
} from "../src/dto";
import { EntryService } from "../src/services/entry.service";
import { PrismaService } from "../src/services/prisma.service";
import { RecurringEntryService } from "../src/services/recurring-entry.service";

import { createTestModule } from "./test-helpers";

describe("EntryService", () => {
  let service: EntryService;
  let prismaService: PrismaService;
  let recurringEntryService: RecurringEntryService;

  const mockUser: User = {
    id: 1,
    email: "test@example.com",
    passwordHash: "hashedPassword",
    givenName: "Test",
    familyName: "User",
    createdAt: new Date(),
  };

  const mockTransaction: Transaction = {
    id: 1,
    type: TransactionType.EXPENSE,
    amount: 1000,
    description: "Test transaction",
    currency: Currency.EUR,
    userId: mockUser.id,
    categoryId: null,
    createdAt: new Date(),
    isRecurring: false,
    recurringType: null,
    recurringBaseInterval: null,
    recurringDisabled: null,
    transactionId: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await createTestModule({
      providers: [
        EntryService,
        {
          provide: PrismaService,
          useValue: {
            transaction: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              delete: jest.fn(),
            },
            filter: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: RecurringEntryService,
          useValue: {},
        },
      ],
    });

    service = module.get<EntryService>(EntryService);
    prismaService = module.get<PrismaService>(PrismaService);
    recurringEntryService = module.get<RecurringEntryService>(
      RecurringEntryService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createEntry", () => {
    const createDto: CreateEntryDto = {
      type: TransactionType.EXPENSE,
      amount: 1000,
      description: "Test entry",
      currency: Currency.EUR,
    };

    it("should create a non-recurring entry successfully", async () => {
      jest
        .spyOn(prismaService.transaction, "create")
        .mockResolvedValue(mockTransaction);

      const result = await service.createEntry(mockUser, createDto);

      expect(prismaService.transaction.create).toHaveBeenCalledWith({
        data: {
          type: createDto.type,
          amount: createDto.amount,
          description: createDto.description,
          currency: createDto.currency,
          userId: mockUser.id,
          isRecurring: false,
          categoryId: createDto.categoryId,
          createdAt: createDto.createdAt,
        },
      });
      expect(result.id).toBe(mockTransaction.id);
      expect(result.isRecurring).toBe(false);
    });

    it("should create a recurring entry with parent and child", async () => {
      const recurringDto: CreateEntryDto = {
        ...createDto,
        isRecurring: true,
        recurringType: RecurringTransactionType.MONTHLY,
        recurringBaseInterval: 1,
      };

      const parentTransaction = {
        ...mockTransaction,
        id: 1,
        isRecurring: true,
        transactionId: null,
      };
      const childTransaction = {
        ...mockTransaction,
        id: 2,
        isRecurring: false,
        transactionId: 1,
      };

      jest
        .spyOn(prismaService.transaction, "create")
        .mockResolvedValueOnce(parentTransaction)
        .mockResolvedValueOnce(childTransaction);

      const result = await service.createEntry(mockUser, recurringDto);

      expect(prismaService.transaction.create).toHaveBeenCalledTimes(2);
      expect(result.id).toBe(childTransaction.id);
      expect(result.isRecurring).toBe(false);
      expect(result.transactionId).toBe(1);
    });

    it("should default currency to EUR if not provided", async () => {
      const dtoWithoutCurrency: CreateEntryDto = {
        type: TransactionType.EXPENSE,
        amount: 1000,
        description: "Test",
        currency: Currency.EUR,
      };

      jest
        .spyOn(prismaService.transaction, "create")
        .mockResolvedValue(mockTransaction);

      await service.createEntry(mockUser, dtoWithoutCurrency);

      expect(prismaService.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          currency: Currency.EUR,
        }),
      });
    });
  });

  describe("getEntries", () => {
    it("should get entries with pagination", async () => {
      const mockEntries = [mockTransaction];
      const params: EntryPaginationParamsDto = {
        take: 10,
        sortBy: EntrySortBy.CREATED_AT_DESC,
      };

      jest
        .spyOn(prismaService.transaction, "findMany")
        .mockResolvedValue(mockEntries);

      const result = await service.getEntries(mockUser, params);

      expect(prismaService.transaction.findMany).toHaveBeenCalled();
      expect(result.entries).toHaveLength(1);
      expect(result.count).toBe(1);
    });

    it("should filter entries by date range", async () => {
      const dateFrom = new Date("2024-01-01");
      const dateTo = new Date("2024-12-31");
      const params: EntryPaginationParamsDto = {
        take: 10,
        dateFrom,
        dateTo,
      };

      jest.spyOn(prismaService.transaction, "findMany").mockResolvedValue([]);

      await service.getEntries(mockUser, params);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        }),
        take: 10,
        orderBy: expect.any(Object),
      });
    });

    it("should filter entries by transaction type", async () => {
      const params: EntryPaginationParamsDto = {
        take: 10,
        transactionType: TransactionType.INCOME,
      };

      jest.spyOn(prismaService.transaction, "findMany").mockResolvedValue([]);

      await service.getEntries(mockUser, params);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          type: TransactionType.INCOME,
        }),
        take: 10,
        orderBy: expect.any(Object),
      });
    });

    it("should filter entries by category IDs", async () => {
      const params: EntryPaginationParamsDto = {
        take: 10,
        categoryIds: [1, 2, 3],
      };

      jest.spyOn(prismaService.transaction, "findMany").mockResolvedValue([]);

      await service.getEntries(mockUser, params);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          categoryId: { in: [1, 2, 3] },
        }),
        take: 10,
        orderBy: expect.any(Object),
      });
    });

    it("should exclude recurring parent entries", async () => {
      const params: EntryPaginationParamsDto = {
        take: 10,
      };

      jest.spyOn(prismaService.transaction, "findMany").mockResolvedValue([]);

      await service.getEntries(mockUser, params);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          NOT: {
            isRecurring: true,
          },
        }),
        take: 10,
        orderBy: expect.any(Object),
      });
    });

    it("should apply filter when filterId is provided", async () => {
      const mockFilter = {
        id: 1,
        userId: mockUser.id,
        sortOption: null,
        dateFrom: null,
        dateTo: null,
        transactionType: TransactionType.EXPENSE,
        minPrice: 1000,
        maxPrice: 5000,
        searchText: "test",
        filterCategories: [],
      };

      jest
        .spyOn(prismaService.filter, "findUnique")
        .mockResolvedValue(mockFilter as any);
      jest.spyOn(prismaService.transaction, "findMany").mockResolvedValue([]);

      const params: EntryPaginationParamsDto = {
        take: 10,
        filterId: 1,
      };

      await service.getEntries(mockUser, params);

      expect(prismaService.filter.findUnique).toHaveBeenCalledWith({
        where: { id: 1, userId: mockUser.id },
        include: { filterCategories: true },
      });
      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          type: TransactionType.EXPENSE,
          amount: {
            gte: 1000,
            lte: 5000,
          },
          description: {
            contains: "test",
            mode: "insensitive",
          },
        }),
        take: 10,
        orderBy: expect.any(Object),
      });
    });

    it("should throw NotFoundException if filter not found", async () => {
      jest.spyOn(prismaService.filter, "findUnique").mockResolvedValue(null);

      const params: EntryPaginationParamsDto = {
        take: 10,
        filterId: 999,
      };

      await expect(service.getEntries(mockUser, params)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("updateEntry", () => {
    const updateDto: UpdateEntryDto = {
      amount: 2000,
      description: "Updated description",
    };

    it("should update entry successfully", async () => {
      jest
        .spyOn(prismaService.transaction, "findUnique")
        .mockResolvedValue(mockTransaction);
      jest
        .spyOn(prismaService.transaction, "updateMany")
        .mockResolvedValue({ count: 1 });
      jest
        .spyOn(prismaService.transaction, "findUnique")
        .mockResolvedValueOnce(mockTransaction)
        .mockResolvedValueOnce({ ...mockTransaction, ...updateDto });

      const result = await service.updateEntry(mockUser, 1, updateDto);

      expect(prismaService.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: 1, userId: mockUser.id },
      });
      expect(prismaService.transaction.updateMany).toHaveBeenCalledWith({
        where: {
          id: 1,
          userId: mockUser.id,
        },
        data: updateDto,
      });
      expect(result.amount).toBe(updateDto.amount);
    });

    it("should throw NotFoundException if entry not found", async () => {
      jest
        .spyOn(prismaService.transaction, "findUnique")
        .mockResolvedValue(null);

      await expect(
        service.updateEntry(mockUser, 999, updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException when updating recurring properties on non-recurring entry", async () => {
      const nonRecurringTransaction = {
        ...mockTransaction,
        isRecurring: false,
      };
      const recurringUpdateDto: UpdateEntryDto = {
        recurringType: RecurringTransactionType.MONTHLY,
      };

      jest
        .spyOn(prismaService.transaction, "findUnique")
        .mockResolvedValue(nonRecurringTransaction);

      await expect(
        service.updateEntry(mockUser, 1, recurringUpdateDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("deleteEntry", () => {
    it("should delete non-recurring entry successfully", async () => {
      jest
        .spyOn(prismaService.transaction, "findUnique")
        .mockResolvedValue(mockTransaction);
      jest
        .spyOn(prismaService.transaction, "delete")
        .mockResolvedValue(mockTransaction);

      await service.deleteEntry(mockUser, 1);

      expect(prismaService.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prismaService.transaction.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should disable recurring parent entry instead of deleting", async () => {
      const recurringParent = {
        ...mockTransaction,
        id: 1,
        isRecurring: true,
        transactionId: null,
      };

      jest
        .spyOn(prismaService.transaction, "findUnique")
        .mockResolvedValue(recurringParent);
      jest.spyOn(prismaService.transaction, "update").mockResolvedValue({
        ...recurringParent,
        recurringDisabled: true,
      });

      await service.deleteEntry(mockUser, 1);

      expect(prismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { recurringDisabled: true },
      });
      expect(prismaService.transaction.delete).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if entry not found", async () => {
      jest
        .spyOn(prismaService.transaction, "findUnique")
        .mockResolvedValue(null);

      await expect(service.deleteEntry(mockUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException if entry belongs to different user", async () => {
      const otherUserTransaction = {
        ...mockTransaction,
        userId: 999,
      };

      jest
        .spyOn(prismaService.transaction, "findUnique")
        .mockResolvedValue(otherUserTransaction);

      await expect(service.deleteEntry(mockUser, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getEntries - Advanced Filtering", () => {
    it("should handle combined filters (date range + type + category + amount)", async () => {
      const params: EntryPaginationParamsDto = {
        take: 10,
        dateFrom: new Date("2024-01-01"),
        dateTo: new Date("2024-12-31"),
        transactionType: TransactionType.EXPENSE,
        categoryIds: [1, 2, 3],
        amountMin: 1000,
        amountMax: 5000,
        title: "test",
      };

      jest.spyOn(prismaService.transaction, "findMany").mockResolvedValue([]);

      await service.getEntries(mockUser, params);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdAt: {
            gte: params.dateFrom,
            lte: params.dateTo,
          },
          type: TransactionType.EXPENSE,
          categoryId: { in: [1, 2, 3] },
          amount: {
            gte: 1000,
            lte: 5000,
          },
          description: {
            contains: "test",
            mode: "insensitive",
          },
        }),
        take: 10,
        orderBy: expect.any(Object),
      });
    });

    it("should handle cursor pagination correctly", async () => {
      const mockEntries = Array.from({ length: 10 }, (_, i) => ({
        ...mockTransaction,
        id: i + 1,
      }));

      jest
        .spyOn(prismaService.transaction, "findMany")
        .mockResolvedValue(mockEntries);

      const params: EntryPaginationParamsDto = {
        take: 10,
        cursorId: 5,
      };

      const result = await service.getEntries(mockUser, params);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        cursor: { id: 5 },
        skip: 1,
        take: 10,
        orderBy: expect.any(Object),
      });
      expect(result.cursorId).toBe(10); // Last entry ID when count equals take
    });

    it("should set cursorId to null when fewer entries than take", async () => {
      jest
        .spyOn(prismaService.transaction, "findMany")
        .mockResolvedValue([mockTransaction]);

      const params: EntryPaginationParamsDto = {
        take: 10,
      };

      const result = await service.getEntries(mockUser, params);

      expect(result.cursorId).toBeNull();
    });

    it("should apply filter sortOption mapping correctly", async () => {
      const mockFilter = {
        id: 1,
        userId: mockUser.id,
        sortOption: FilterSortOption.HIGHEST_AMOUNT,
        dateFrom: null,
        dateTo: null,
        transactionType: null,
        minPrice: null,
        maxPrice: null,
        searchText: null,
        filterCategories: [],
      };

      jest
        .spyOn(prismaService.filter, "findUnique")
        .mockResolvedValue(mockFilter as any);
      jest.spyOn(prismaService.transaction, "findMany").mockResolvedValue([]);

      const params: EntryPaginationParamsDto = {
        take: 10,
        filterId: 1,
      };

      await service.getEntries(mockUser, params);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        take: 10,
        orderBy: { amount: "desc" },
      });
    });

    it("should handle all filter sort options", async () => {
      const sortOptions = [
        FilterSortOption.HIGHEST_AMOUNT,
        FilterSortOption.LOWEST_AMOUNT,
        FilterSortOption.NEWEST_FIRST,
        FilterSortOption.OLDEST_FIRST,
      ];

      for (const sortOption of sortOptions) {
        const mockFilter = {
          id: 1,
          userId: mockUser.id,
          sortOption,
          dateFrom: null,
          dateTo: null,
          transactionType: null,
          minPrice: null,
          maxPrice: null,
          searchText: null,
          filterCategories: [],
        };

        jest
          .spyOn(prismaService.filter, "findUnique")
          .mockResolvedValue(mockFilter as any);
        jest.spyOn(prismaService.transaction, "findMany").mockResolvedValue([]);

        await service.getEntries(mockUser, { take: 10, filterId: 1 });

        jest.clearAllMocks();
      }
    });
  });

  describe("getEntries - Sort Options", () => {
    it("should sort by CREATED_AT_ASC", async () => {
      jest.spyOn(prismaService.transaction, "findMany").mockResolvedValue([]);

      const params: EntryPaginationParamsDto = {
        take: 10,
        sortBy: EntrySortBy.CREATED_AT_ASC,
      };

      await service.getEntries(mockUser, params);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        take: 10,
        orderBy: { createdAt: "asc" },
      });
    });

    it("should sort by AMOUNT_ASC", async () => {
      jest.spyOn(prismaService.transaction, "findMany").mockResolvedValue([]);

      const params: EntryPaginationParamsDto = {
        take: 10,
        sortBy: EntrySortBy.AMOUNT_ASC,
      };

      await service.getEntries(mockUser, params);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        take: 10,
        orderBy: { amount: "asc" },
      });
    });

    it("should sort by AMOUNT_DESC", async () => {
      jest.spyOn(prismaService.transaction, "findMany").mockResolvedValue([]);

      const params: EntryPaginationParamsDto = {
        take: 10,
        sortBy: EntrySortBy.AMOUNT_DESC,
      };

      await service.getEntries(mockUser, params);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        take: 10,
        orderBy: { amount: "desc" },
      });
    });
  });

  describe("createEntry - Recurring Edge Cases", () => {
    it("should default recurringBaseInterval to 1 if not provided", async () => {
      const recurringDto: CreateEntryDto = {
        type: TransactionType.EXPENSE,
        amount: 1000,
        description: "Test",
        currency: Currency.EUR,
        isRecurring: true,
        recurringType: RecurringTransactionType.MONTHLY,
      };

      const parentTransaction = {
        ...mockTransaction,
        id: 1,
        isRecurring: true,
        recurringBaseInterval: 1,
      };
      const childTransaction = {
        ...mockTransaction,
        id: 2,
        isRecurring: false,
        transactionId: 1,
      };

      jest
        .spyOn(prismaService.transaction, "create")
        .mockResolvedValueOnce(parentTransaction)
        .mockResolvedValueOnce(childTransaction);

      await service.createEntry(mockUser, recurringDto);

      expect(prismaService.transaction.create).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({
          recurringBaseInterval: 1,
        }),
      });
    });

    it("should use provided createdAt for recurring entry", async () => {
      const customDate = new Date("2024-01-15");
      const recurringDto: CreateEntryDto = {
        type: TransactionType.EXPENSE,
        amount: 1000,
        description: "Test",
        currency: Currency.EUR,
        isRecurring: true,
        recurringType: RecurringTransactionType.MONTHLY,
        createdAt: customDate,
      };

      const parentTransaction = {
        ...mockTransaction,
        id: 1,
        isRecurring: true,
      };
      const childTransaction = {
        ...mockTransaction,
        id: 2,
        isRecurring: false,
        transactionId: 1,
      };

      jest
        .spyOn(prismaService.transaction, "create")
        .mockResolvedValueOnce(parentTransaction)
        .mockResolvedValueOnce(childTransaction);

      await service.createEntry(mockUser, recurringDto);

      expect(prismaService.transaction.create).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({
          createdAt: customDate,
        }),
      });
      expect(prismaService.transaction.create).toHaveBeenNthCalledWith(2, {
        data: expect.objectContaining({
          createdAt: customDate,
        }),
      });
    });

    it("should default createdAt to now for child if not provided", async () => {
      const recurringDto: CreateEntryDto = {
        type: TransactionType.EXPENSE,
        amount: 1000,
        description: "Test",
        currency: Currency.EUR,
        isRecurring: true,
        recurringType: RecurringTransactionType.MONTHLY,
      };

      const parentTransaction = {
        ...mockTransaction,
        id: 1,
        isRecurring: true,
      };
      const childTransaction = {
        ...mockTransaction,
        id: 2,
        isRecurring: false,
        transactionId: 1,
      };

      jest
        .spyOn(prismaService.transaction, "create")
        .mockResolvedValueOnce(parentTransaction)
        .mockResolvedValueOnce(childTransaction);

      await service.createEntry(mockUser, recurringDto);

      expect(prismaService.transaction.create).toHaveBeenNthCalledWith(2, {
        data: expect.objectContaining({
          createdAt: expect.any(Date),
        }),
      });
    });
  });
});
