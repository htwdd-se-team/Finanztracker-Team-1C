import { createMock } from "@golevelup/ts-jest";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import {
  FilterSortOption,
  RecurringTransactionType,
  Transaction,
  TransactionType,
  User,
} from "@prisma/client";

import {
  Currency,
  CreateEntryDto,
  EntryPaginationParamsDto,
  EntrySortBy,
  UpdateEntryDto,
} from "../src/dto";
import { EntryService } from "../src/services/entry.service";
import { PrismaService } from "../src/services/prisma.service";
import { RecurringEntryService } from "../src/services/recurring-entry.service";

import { createTestModule } from "./test-helpers";

describe("EntryService", () => {
  let service: EntryService;
  let module: TestingModule;
  let mockTransactionCreate: jest.Mock;
  let mockTransactionFindUnique: jest.Mock;
  let mockTransactionFindMany: jest.Mock;
  let mockTransactionUpdate: jest.Mock;
  let mockTransactionUpdateMany: jest.Mock;
  let mockTransactionDelete: jest.Mock;
  let mockFilterFindUnique: jest.Mock;

  const mockUser: User = {
    id: 1,
    email: "test@example.com",
    passwordHash: "hashed",
    givenName: "Test",
    familyName: "User",
    emergencyReserve: 100000,
    createdAt: new Date("2024-01-01"),
  };

  const mockTransaction: Transaction = {
    id: 1,
    type: TransactionType.EXPENSE,
    amount: 1000,
    description: "Test Entry",
    currency: Currency.EUR,
    userId: mockUser.id,
    categoryId: null,
    createdAt: new Date("2024-01-01"),
    isRecurring: false,
    recurringType: null,
    recurringBaseInterval: null,
    recurringDisabled: null,
    transactionId: null,
  };

  beforeAll(async () => {
    mockTransactionCreate = jest.fn();
    mockTransactionFindUnique = jest.fn();
    mockTransactionFindMany = jest.fn();
    mockTransactionUpdate = jest.fn();
    mockTransactionUpdateMany = jest.fn();
    mockTransactionDelete = jest.fn();
    mockFilterFindUnique = jest.fn();

    const mockPrismaService = createMock<PrismaService>({
      transaction: {
        create: mockTransactionCreate,
        findUnique: mockTransactionFindUnique,
        findMany: mockTransactionFindMany,
        update: mockTransactionUpdate,
        updateMany: mockTransactionUpdateMany,
        delete: mockTransactionDelete,
      },
      filter: {
        findUnique: mockFilterFindUnique,
      },
    } as unknown as PrismaService);

    const mockRecurringEntryService = createMock<RecurringEntryService>({});

    module = await createTestModule({
      providers: [
        EntryService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RecurringEntryService,
          useValue: mockRecurringEntryService,
        },
      ],
    });

    service = module.get<EntryService>(EntryService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createEntry", () => {
    it("should create a non-recurring entry successfully", async () => {
      const createDto: CreateEntryDto = {
        type: TransactionType.EXPENSE,
        amount: 1000,
        description: "Test Entry",
        currency: Currency.EUR,
      };

      mockTransactionCreate.mockResolvedValue(mockTransaction);

      const result = await service.createEntry(mockUser, createDto);

      expect(result.id).toBe(mockTransaction.id);
      expect(result.amount).toBe(1000);
      expect(result.isRecurring).toBe(false);
      expect(mockTransactionCreate).toHaveBeenCalledTimes(1);
      expect(mockTransactionCreate).toHaveBeenCalledWith({
        data: {
          type: createDto.type,
          amount: createDto.amount,
          description: createDto.description,
          currency: Currency.EUR,
          userId: mockUser.id,
          isRecurring: false,
          categoryId: createDto.categoryId,
          createdAt: createDto.createdAt,
        },
      });
    });

    it("should create a recurring entry with parent and child", async () => {
      const createDto: CreateEntryDto = {
        type: TransactionType.EXPENSE,
        amount: 2000,
        description: "Recurring Entry",
        currency: Currency.EUR,
        isRecurring: true,
        recurringType: RecurringTransactionType.MONTHLY,
        recurringBaseInterval: 1,
        createdAt: new Date("2024-01-01"),
      };

      const parentEntry = {
        ...mockTransaction,
        id: 1,
        isRecurring: true,
        recurringType: RecurringTransactionType.MONTHLY,
        recurringBaseInterval: 1,
        recurringDisabled: false,
      };

      const childEntry = {
        ...mockTransaction,
        id: 2,
        isRecurring: false,
        transactionId: 1,
      };

      mockTransactionCreate
        .mockResolvedValueOnce(parentEntry)
        .mockResolvedValueOnce(childEntry);

      const result = await service.createEntry(mockUser, createDto);

      expect(result.id).toBe(2);
      expect(result.transactionId).toBe(1);
      expect(mockTransactionCreate).toHaveBeenCalledTimes(2);
    });

    it("should default currency to EUR if not provided", async () => {
      const createDto: CreateEntryDto = {
        type: TransactionType.EXPENSE,
        amount: 1000,
        currency: Currency.EUR,
      };

      mockTransactionCreate.mockResolvedValue(mockTransaction);

      await service.createEntry(mockUser, createDto);

      expect(mockTransactionCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          currency: Currency.EUR,
        }),
      });
    });

    it("should default recurringBaseInterval to 1 if not provided", async () => {
      const createDto: CreateEntryDto = {
        type: TransactionType.EXPENSE,
        amount: 2000,
        currency: Currency.EUR,
        isRecurring: true,
        recurringType: RecurringTransactionType.MONTHLY,
      };

      const parentEntry = {
        ...mockTransaction,
        id: 1,
        isRecurring: true,
        recurringBaseInterval: 1,
      };

      const childEntry = {
        ...mockTransaction,
        id: 2,
        transactionId: 1,
      };

      mockTransactionCreate
        .mockResolvedValueOnce(parentEntry)
        .mockResolvedValueOnce(childEntry);

      await service.createEntry(mockUser, createDto);

      expect(mockTransactionCreate).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({
          recurringBaseInterval: 1,
        }),
      });
    });

    it("should use provided createdAt for recurring entry", async () => {
      const createdAt = new Date("2024-01-15");
      const createDto: CreateEntryDto = {
        type: TransactionType.EXPENSE,
        amount: 2000,
        currency: Currency.EUR,
        isRecurring: true,
        recurringType: RecurringTransactionType.MONTHLY,
        createdAt,
      };

      const parentEntry = {
        ...mockTransaction,
        id: 1,
        isRecurring: true,
        createdAt,
      };

      const childEntry = {
        ...mockTransaction,
        id: 2,
        transactionId: 1,
        createdAt,
      };

      mockTransactionCreate
        .mockResolvedValueOnce(parentEntry)
        .mockResolvedValueOnce(childEntry);

      await service.createEntry(mockUser, createDto);

      expect(mockTransactionCreate).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({
          createdAt,
        }),
      });
      expect(mockTransactionCreate).toHaveBeenNthCalledWith(2, {
        data: expect.objectContaining({
          createdAt,
        }),
      });
    });

    it("should default createdAt to now for child if not provided", async () => {
      const createdAt = new Date("2024-01-15");
      const createDto: CreateEntryDto = {
        type: TransactionType.EXPENSE,
        amount: 2000,
        currency: Currency.EUR,
        isRecurring: true,
        recurringType: RecurringTransactionType.MONTHLY,
        createdAt,
      };

      const parentEntry = {
        ...mockTransaction,
        id: 1,
        isRecurring: true,
        createdAt,
      };

      const childEntry = {
        ...mockTransaction,
        id: 2,
        transactionId: 1,
      };

      mockTransactionCreate
        .mockResolvedValueOnce(parentEntry)
        .mockResolvedValueOnce(childEntry);

      await service.createEntry(mockUser, createDto);

      expect(mockTransactionCreate).toHaveBeenNthCalledWith(2, {
        data: expect.objectContaining({
          createdAt: expect.any(Date),
        }),
      });
    });
  });

  describe("getEntries", () => {
    it("should get entries with pagination", async () => {
      const params: EntryPaginationParamsDto = {
        take: 10,
      };

      const entries = [mockTransaction];
      mockTransactionFindMany.mockResolvedValue(entries);

      const result = await service.getEntries(mockUser, params);

      expect(result.entries).toHaveLength(1);
      expect(result.count).toBe(1);
      expect(mockTransactionFindMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: mockUser.id,
          NOT: { isRecurring: true },
        }),
        take: 10,
        orderBy: { createdAt: "desc" },
      });
    });

    it("should filter entries by date range", async () => {
      const params: EntryPaginationParamsDto = {
        take: 10,
        dateFrom: new Date("2024-01-01"),
        dateTo: new Date("2024-12-31"),
      };

      mockTransactionFindMany.mockResolvedValue([]);

      await service.getEntries(mockUser, params);

      expect(mockTransactionFindMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdAt: {
            gte: params.dateFrom,
            lte: params.dateTo,
          },
        }),
        take: 10,
        orderBy: { createdAt: "desc" },
      });
    });

    it("should filter entries by transaction type", async () => {
      const params: EntryPaginationParamsDto = {
        take: 10,
        transactionType: TransactionType.INCOME,
      };

      mockTransactionFindMany.mockResolvedValue([]);

      await service.getEntries(mockUser, params);

      expect(mockTransactionFindMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          type: TransactionType.INCOME,
        }),
        take: 10,
        orderBy: { createdAt: "desc" },
      });
    });

    it("should filter entries by category IDs", async () => {
      const params: EntryPaginationParamsDto = {
        take: 10,
        categoryIds: [1, 2, 3],
      };

      mockTransactionFindMany.mockResolvedValue([]);

      await service.getEntries(mockUser, params);

      expect(mockTransactionFindMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          categoryId: { in: [1, 2, 3] },
        }),
        take: 10,
        orderBy: { createdAt: "desc" },
      });
    });

    it("should exclude recurring parent entries", async () => {
      const params: EntryPaginationParamsDto = {
        take: 10,
      };

      mockTransactionFindMany.mockResolvedValue([]);

      await service.getEntries(mockUser, params);

      expect(mockTransactionFindMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          NOT: { isRecurring: true },
        }),
        take: 10,
        orderBy: { createdAt: "desc" },
      });
    });

    it("should apply filter when filterId is provided", async () => {
      const params: EntryPaginationParamsDto = {
        take: 10,
        filterId: 1,
      };

      const mockFilter = {
        id: 1,
        sortOption: FilterSortOption.HIGHEST_AMOUNT,
        dateFrom: new Date("2024-01-01"),
        dateTo: new Date("2024-12-31"),
        transactionType: TransactionType.EXPENSE,
        minPrice: 1000,
        maxPrice: 5000,
        searchText: "test",
        filterCategories: [{ filterId: 1, categoryId: 1 }],
      };

      mockFilterFindUnique.mockResolvedValue(mockFilter);
      mockTransactionFindMany.mockResolvedValue([]);

      await service.getEntries(mockUser, params);

      expect(mockFilterFindUnique).toHaveBeenCalledWith({
        where: { id: 1, userId: mockUser.id },
        include: { filterCategories: true },
      });
      expect(mockTransactionFindMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdAt: {
            gte: mockFilter.dateFrom,
            lte: mockFilter.dateTo,
          },
          type: TransactionType.EXPENSE,
          categoryId: { in: [1] },
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
        orderBy: { amount: "desc" },
      });
    });

    it("should throw NotFoundException if filter not found", async () => {
      const params: EntryPaginationParamsDto = {
        take: 10,
        filterId: 999,
      };

      mockFilterFindUnique.mockResolvedValue(null);

      await expect(service.getEntries(mockUser, params)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should handle combined filters (date range + type + category + amount)", async () => {
      const params: EntryPaginationParamsDto = {
        take: 10,
        dateFrom: new Date("2024-01-01"),
        dateTo: new Date("2024-12-31"),
        transactionType: TransactionType.EXPENSE,
        categoryIds: [1, 2],
        amountMin: 1000,
        amountMax: 5000,
      };

      mockTransactionFindMany.mockResolvedValue([]);

      await service.getEntries(mockUser, params);

      expect(mockTransactionFindMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdAt: {
            gte: params.dateFrom,
            lte: params.dateTo,
          },
          type: TransactionType.EXPENSE,
          categoryId: { in: [1, 2] },
          amount: {
            gte: 1000,
            lte: 5000,
          },
        }),
        take: 10,
        orderBy: { createdAt: "desc" },
      });
    });

    it("should handle cursor pagination correctly", async () => {
      const params: EntryPaginationParamsDto = {
        take: 10,
        cursorId: 5,
      };

      const entries = Array.from({ length: 10 }, (_, i) => ({
        ...mockTransaction,
        id: 6 + i,
      }));

      mockTransactionFindMany.mockResolvedValue(entries);

      const result = await service.getEntries(mockUser, params);

      expect(result.cursorId).toBe(15);
      expect(mockTransactionFindMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        cursor: { id: 5 },
        skip: 1,
        take: 10,
        orderBy: { createdAt: "desc" },
      });
    });

    it("should set cursorId to null when fewer entries than take", async () => {
      const params: EntryPaginationParamsDto = {
        take: 10,
      };

      const entries = Array.from({ length: 5 }, (_, i) => ({
        ...mockTransaction,
        id: i + 1,
      }));

      mockTransactionFindMany.mockResolvedValue(entries);

      const result = await service.getEntries(mockUser, params);

      expect(result.cursorId).toBeNull();
    });

    it("should apply filter sortOption mapping correctly", async () => {
      const params: EntryPaginationParamsDto = {
        take: 10,
        filterId: 1,
      };

      const mockFilter = {
        id: 1,
        sortOption: FilterSortOption.LOWEST_AMOUNT,
        filterCategories: [],
      };

      mockFilterFindUnique.mockResolvedValue(mockFilter);
      mockTransactionFindMany.mockResolvedValue([]);

      await service.getEntries(mockUser, params);

      expect(mockTransactionFindMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        take: 10,
        orderBy: { amount: "asc" },
      });
    });

    it("should handle all filter sort options", async () => {
      const testCases = [
        {
          sortOption: FilterSortOption.HIGHEST_AMOUNT,
          expectedOrderBy: { amount: "desc" },
        },
        {
          sortOption: FilterSortOption.LOWEST_AMOUNT,
          expectedOrderBy: { amount: "asc" },
        },
        {
          sortOption: FilterSortOption.NEWEST_FIRST,
          expectedOrderBy: { createdAt: "desc" },
        },
        {
          sortOption: FilterSortOption.OLDEST_FIRST,
          expectedOrderBy: { createdAt: "asc" },
        },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();
        const params: EntryPaginationParamsDto = {
          take: 10,
          filterId: 1,
        };

        const mockFilter = {
          id: 1,
          sortOption: testCase.sortOption,
          filterCategories: [],
        };

        mockFilterFindUnique.mockResolvedValue(mockFilter);
        mockTransactionFindMany.mockResolvedValue([]);

        await service.getEntries(mockUser, params);

        expect(mockTransactionFindMany).toHaveBeenCalledWith({
          where: expect.any(Object),
          take: 10,
          orderBy: testCase.expectedOrderBy,
        });
      }
    });

    it("should sort by CREATED_AT_ASC", async () => {
      const params: EntryPaginationParamsDto = {
        take: 10,
        sortBy: EntrySortBy.CREATED_AT_ASC,
      };

      mockTransactionFindMany.mockResolvedValue([]);

      await service.getEntries(mockUser, params);

      expect(mockTransactionFindMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        take: 10,
        orderBy: { createdAt: "asc" },
      });
    });

    it("should sort by AMOUNT_ASC", async () => {
      const params: EntryPaginationParamsDto = {
        take: 10,
        sortBy: EntrySortBy.AMOUNT_ASC,
      };

      mockTransactionFindMany.mockResolvedValue([]);

      await service.getEntries(mockUser, params);

      expect(mockTransactionFindMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        take: 10,
        orderBy: { amount: "asc" },
      });
    });

    it("should sort by AMOUNT_DESC", async () => {
      const params: EntryPaginationParamsDto = {
        take: 10,
        sortBy: EntrySortBy.AMOUNT_DESC,
      };

      mockTransactionFindMany.mockResolvedValue([]);

      await service.getEntries(mockUser, params);

      expect(mockTransactionFindMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        take: 10,
        orderBy: { amount: "desc" },
      });
    });
  });

  describe("updateEntry", () => {
    it("should update entry successfully", async () => {
      const updateDto: UpdateEntryDto = {
        amount: 2000,
        description: "Updated Entry",
      };

      mockTransactionFindUnique.mockResolvedValue(mockTransaction);
      mockTransactionUpdateMany.mockResolvedValue({ count: 1 });
      mockTransactionFindUnique
        .mockResolvedValueOnce(mockTransaction)
        .mockResolvedValueOnce({
          ...mockTransaction,
          ...updateDto,
        });

      const result = await service.updateEntry(mockUser, 1, updateDto);

      expect(result.amount).toBe(2000);
      expect(result.description).toBe("Updated Entry");
      expect(mockTransactionUpdateMany).toHaveBeenCalledWith({
        where: { id: 1, userId: mockUser.id },
        data: updateDto,
      });
    });

    it("should throw NotFoundException if entry not found", async () => {
      const updateDto: UpdateEntryDto = {
        amount: 2000,
      };

      mockTransactionFindUnique.mockResolvedValue(null);

      await expect(
        service.updateEntry(mockUser, 999, updateDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockTransactionUpdateMany).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException when updating recurring properties on non-recurring entry", async () => {
      const updateDto: UpdateEntryDto = {
        recurringType: RecurringTransactionType.MONTHLY,
      };

      mockTransactionFindUnique.mockResolvedValue(mockTransaction);

      await expect(service.updateEntry(mockUser, 1, updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("deleteEntry", () => {
    it("should delete non-recurring entry successfully", async () => {
      mockTransactionFindUnique.mockResolvedValue(mockTransaction);
      mockTransactionDelete.mockResolvedValue(mockTransaction);

      await service.deleteEntry(mockUser, 1);

      expect(mockTransactionDelete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should disable recurring parent entry instead of deleting", async () => {
      const recurringEntry = {
        ...mockTransaction,
        isRecurring: true,
        transactionId: null,
      };

      mockTransactionFindUnique.mockResolvedValue(recurringEntry);
      mockTransactionUpdate.mockResolvedValue({
        ...recurringEntry,
        recurringDisabled: true,
      });

      await service.deleteEntry(mockUser, 1);

      expect(mockTransactionUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { recurringDisabled: true },
      });
      expect(mockTransactionDelete).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if entry not found", async () => {
      mockTransactionFindUnique.mockResolvedValue(null);

      await expect(service.deleteEntry(mockUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException if entry belongs to different user", async () => {
      const differentUserEntry = {
        ...mockTransaction,
        userId: 999,
      };

      mockTransactionFindUnique.mockResolvedValue(differentUserEntry);

      await expect(service.deleteEntry(mockUser, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
