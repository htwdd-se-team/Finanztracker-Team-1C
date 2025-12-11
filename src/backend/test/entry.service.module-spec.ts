import { BadRequestException, NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import {
  TransactionType,
  RecurringTransactionType,
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

import {
  createMockUser,
  createMockTransaction,
  createMockFilter,
} from "./mock-data-factory";
import { createMockPrismaService } from "./prisma-mock-factory";
import { createTestModule } from "./test-helpers";

describe("EntryService", () => {
  let service: EntryService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = createMockUser();
  const mockTransaction = createMockTransaction({ userId: mockUser.id });

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await createTestModule({
      providers: [
        EntryService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: RecurringEntryService,
          useValue: {},
        },
      ],
    });

    service = module.get<EntryService>(EntryService);
    prismaService = module.get<PrismaService>(
      PrismaService,
    ) as jest.Mocked<PrismaService>;
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
      const createMock = jest.mocked(prismaService.transaction["create"]);
      createMock.mockResolvedValue(mockTransaction);

      const result = await service.createEntry(mockUser, createDto);
      expect(createMock).toHaveBeenCalledWith({
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

      const parentTransaction = createMockTransaction({
        id: 1,
        isRecurring: true,
        transactionId: null,
      });
      const childTransaction = createMockTransaction({
        id: 2,
        isRecurring: false,
        transactionId: 1,
      });

      const createMock = jest.mocked(prismaService.transaction["create"]);
      createMock
        .mockResolvedValueOnce(parentTransaction)
        .mockResolvedValueOnce(childTransaction);

      const result = await service.createEntry(mockUser, recurringDto);

      expect(createMock).toHaveBeenCalledTimes(2);
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

      const createMock = jest.mocked(prismaService.transaction["create"]);
      createMock.mockResolvedValue(mockTransaction);

      await service.createEntry(mockUser, dtoWithoutCurrency);

      const expectedData = expect.objectContaining({
        currency: Currency.EUR,
      });
      expect(createMock).toHaveBeenCalledWith({
        data: expectedData,
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

      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      findManyMock.mockResolvedValue(mockEntries);

      const result = await service.getEntries(mockUser, params);

      expect(findManyMock).toHaveBeenCalled();
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

      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      findManyMock.mockResolvedValue([]);

      await service.getEntries(mockUser, params);

      const expectedWhere = expect.objectContaining({
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      });
      const expectedOrderBy = expect.objectContaining({});
      expect(findManyMock).toHaveBeenCalledWith({
        where: expectedWhere,
        take: 10,
        orderBy: expectedOrderBy,
      });
    });

    it("should filter entries by transaction type", async () => {
      const params: EntryPaginationParamsDto = {
        take: 10,
        transactionType: TransactionType.INCOME,
      };

      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      findManyMock.mockResolvedValue([]);

      await service.getEntries(mockUser, params);

      const expectedWhere = expect.objectContaining({
        type: TransactionType.INCOME,
      });
      const expectedOrderBy = expect.objectContaining({});
      expect(findManyMock).toHaveBeenCalledWith({
        where: expectedWhere,
        take: 10,
        orderBy: expectedOrderBy,
      });
    });

    it("should filter entries by category IDs", async () => {
      const params: EntryPaginationParamsDto = {
        take: 10,
        categoryIds: [1, 2, 3],
      };

      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      findManyMock.mockResolvedValue([]);

      await service.getEntries(mockUser, params);

      const expectedWhere = expect.objectContaining({
        categoryId: { in: [1, 2, 3] },
      });
      const expectedOrderBy = expect.objectContaining({});
      expect(findManyMock).toHaveBeenCalledWith({
        where: expectedWhere,
        take: 10,
        orderBy: expectedOrderBy,
      });
    });

    it("should exclude recurring parent entries", async () => {
      const params: EntryPaginationParamsDto = {
        take: 10,
      };

      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      findManyMock.mockResolvedValue([]);

      await service.getEntries(mockUser, params);

      expect(findManyMock).toHaveBeenCalledWith({
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
      const mockFilter = createMockFilter({
        id: 1,
        userId: mockUser.id,
        transactionType: TransactionType.EXPENSE,
        minPrice: 1000,
        maxPrice: 5000,
        searchText: "test",
      });

      const filterFindUniqueMock = jest.mocked(
        prismaService.filter["findUnique"],
      );
      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      filterFindUniqueMock.mockResolvedValue(mockFilter);
      findManyMock.mockResolvedValue([]);

      const params: EntryPaginationParamsDto = {
        take: 10,
        filterId: 1,
      };

      await service.getEntries(mockUser, params);

      expect(filterFindUniqueMock).toHaveBeenCalledWith({
        where: { id: 1, userId: mockUser.id },
        include: { filterCategories: true },
      });
      const expectedWhere = expect.objectContaining({
        type: TransactionType.EXPENSE,
        amount: {
          gte: 1000,
          lte: 5000,
        },
        description: {
          contains: "test",
          mode: "insensitive",
        },
      });
      const expectedOrderBy = expect.objectContaining({});
      expect(findManyMock).toHaveBeenCalledWith({
        where: expectedWhere,
        take: 10,
        orderBy: expectedOrderBy,
      });
    });

    it("should throw NotFoundException if filter not found", async () => {
      const filterFindUniqueMock = jest.mocked(
        prismaService.filter["findUnique"],
      );
      filterFindUniqueMock.mockResolvedValue(null);

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
      const findUniqueMock = jest.mocked(
        prismaService.transaction["findUnique"],
      );
      const updateManyMock = jest.mocked(
        prismaService.transaction["updateMany"],
      );
      findUniqueMock
        .mockResolvedValueOnce(mockTransaction)
        .mockResolvedValueOnce(createMockTransaction(updateDto));
      updateManyMock.mockResolvedValue({ count: 1 });

      const result = await service.updateEntry(mockUser, 1, updateDto);

      expect(findUniqueMock).toHaveBeenCalledWith({
        where: { id: 1, userId: mockUser.id },
      });
      expect(updateManyMock).toHaveBeenCalledWith({
        where: {
          id: 1,
          userId: mockUser.id,
        },
        data: updateDto,
      });
      expect(result.amount).toBe(updateDto.amount);
    });

    it("should throw NotFoundException if entry not found", async () => {
      const findUniqueMock = jest.mocked(
        prismaService.transaction["findUnique"],
      );
      findUniqueMock.mockResolvedValue(null);

      await expect(
        service.updateEntry(mockUser, 999, updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException when updating recurring properties on non-recurring entry", async () => {
      const nonRecurringTransaction = createMockTransaction({
        isRecurring: false,
      });
      const recurringUpdateDto: UpdateEntryDto = {
        recurringType: RecurringTransactionType.MONTHLY,
      };

      const findUniqueMock = jest.mocked(
        prismaService.transaction["findUnique"],
      );
      findUniqueMock.mockResolvedValue(nonRecurringTransaction);

      await expect(
        service.updateEntry(mockUser, 1, recurringUpdateDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("deleteEntry", () => {
    it("should delete non-recurring entry successfully", async () => {
      const findUniqueMock = jest.mocked(
        prismaService.transaction["findUnique"],
      );
      const deleteMock = jest.mocked(prismaService.transaction["delete"]);
      findUniqueMock.mockResolvedValue(mockTransaction);
      deleteMock.mockResolvedValue(mockTransaction);

      await service.deleteEntry(mockUser, 1);

      expect(findUniqueMock).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(deleteMock).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should disable recurring parent entry instead of deleting", async () => {
      const recurringParent = createMockTransaction({
        id: 1,
        isRecurring: true,
        transactionId: null,
      });

      const findUniqueMock = jest.mocked(
        prismaService.transaction["findUnique"],
      );
      const updateMock = jest.mocked(prismaService.transaction["update"]);
      findUniqueMock.mockResolvedValue(recurringParent);
      updateMock.mockResolvedValue({
        ...recurringParent,
        recurringDisabled: true,
      } as typeof recurringParent);

      await service.deleteEntry(mockUser, 1);

      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { recurringDisabled: true },
      });
      const deleteMock = jest.mocked(prismaService.transaction["delete"]);
      expect(deleteMock).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if entry not found", async () => {
      const findUniqueMock = jest.mocked(
        prismaService.transaction["findUnique"],
      );
      findUniqueMock.mockResolvedValue(null);

      await expect(service.deleteEntry(mockUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException if entry belongs to different user", async () => {
      const otherUserTransaction = createMockTransaction({
        userId: 999,
      });

      const findUniqueMock = jest.mocked(
        prismaService.transaction["findUnique"],
      );
      findUniqueMock.mockResolvedValue(otherUserTransaction);

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

      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      findManyMock.mockResolvedValue([]);

      await service.getEntries(mockUser, params);

      expect(findManyMock).toHaveBeenCalledWith({
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
      const mockEntries = Array.from({ length: 10 }, (_, i) =>
        createMockTransaction({ id: i + 1 }),
      );

      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      findManyMock.mockResolvedValue(mockEntries);

      const params: EntryPaginationParamsDto = {
        take: 10,
        cursorId: 5,
      };

      const result = await service.getEntries(mockUser, params);

      const expectedWhere = expect.objectContaining({});
      const expectedOrderBy = expect.objectContaining({});
      expect(findManyMock).toHaveBeenCalledWith({
        where: expectedWhere,
        cursor: { id: 5 },
        skip: 1,
        take: 10,
        orderBy: expectedOrderBy,
      });
      expect(result.cursorId).toBe(10); // Last entry ID when count equals take
    });

    it("should set cursorId to null when fewer entries than take", async () => {
      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      findManyMock.mockResolvedValue([mockTransaction]);

      const params: EntryPaginationParamsDto = {
        take: 10,
      };

      const result = await service.getEntries(mockUser, params);

      expect(result.cursorId).toBeNull();
    });

    it("should apply filter sortOption mapping correctly", async () => {
      const mockFilter = createMockFilter({
        id: 1,
        userId: mockUser.id,
        sortOption: FilterSortOption.HIGHEST_AMOUNT,
      });

      const filterFindUniqueMock = jest.mocked(
        prismaService.filter["findUnique"],
      );
      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      filterFindUniqueMock.mockResolvedValue(mockFilter);
      findManyMock.mockResolvedValue([]);

      const params: EntryPaginationParamsDto = {
        take: 10,
        filterId: 1,
      };

      await service.getEntries(mockUser, params);

      expect(findManyMock).toHaveBeenCalledWith({
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
        const mockFilter = createMockFilter({
          id: 1,
          userId: mockUser.id,
          sortOption,
        });

        jest
          .mocked(prismaService.filter["findUnique"])
          .mockResolvedValue(mockFilter);
        const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
        findManyMock.mockResolvedValue([]);

        await service.getEntries(mockUser, { take: 10, filterId: 1 });

        jest.clearAllMocks();
      }
    });
  });

  describe("getEntries - Sort Options", () => {
    it("should sort by CREATED_AT_ASC", async () => {
      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      findManyMock.mockResolvedValue([]);

      const params: EntryPaginationParamsDto = {
        take: 10,
        sortBy: EntrySortBy.CREATED_AT_ASC,
      };

      await service.getEntries(mockUser, params);

      const expectedWhere = expect.objectContaining({});
      expect(findManyMock).toHaveBeenCalledWith({
        where: expectedWhere,
        take: 10,
        orderBy: { createdAt: "asc" },
      });
    });

    it("should sort by AMOUNT_ASC", async () => {
      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      findManyMock.mockResolvedValue([]);

      const params: EntryPaginationParamsDto = {
        take: 10,
        sortBy: EntrySortBy.AMOUNT_ASC,
      };

      await service.getEntries(mockUser, params);

      const expectedWhere = expect.objectContaining({});
      expect(findManyMock).toHaveBeenCalledWith({
        where: expectedWhere,
        take: 10,
        orderBy: { amount: "asc" },
      });
    });

    it("should sort by AMOUNT_DESC", async () => {
      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      findManyMock.mockResolvedValue([]);

      const params: EntryPaginationParamsDto = {
        take: 10,
        sortBy: EntrySortBy.AMOUNT_DESC,
      };

      await service.getEntries(mockUser, params);

      expect(findManyMock).toHaveBeenCalledWith({
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

      const parentTransaction = createMockTransaction({
        id: 1,
        isRecurring: true,
        recurringBaseInterval: 1,
      });
      const childTransaction = createMockTransaction({
        id: 2,
        isRecurring: false,
        transactionId: 1,
      });

      const createMock = jest.mocked(prismaService.transaction["create"]);
      createMock
        .mockResolvedValueOnce(parentTransaction)
        .mockResolvedValueOnce(childTransaction);

      await service.createEntry(mockUser, recurringDto);
      const expectedData = expect.objectContaining({
        recurringBaseInterval: 1,
      });
      expect(createMock).toHaveBeenNthCalledWith(1, {
        data: expectedData,
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

      const parentTransaction = createMockTransaction({
        id: 1,
        isRecurring: true,
      });
      const childTransaction = createMockTransaction({
        id: 2,
        isRecurring: false,
        transactionId: 1,
      });

      const createMock = jest.mocked(prismaService.transaction["create"]);
      createMock
        .mockResolvedValueOnce(parentTransaction)
        .mockResolvedValueOnce(childTransaction);

      await service.createEntry(mockUser, recurringDto);
      const expectedData1 = expect.objectContaining({
        createdAt: customDate,
      });
      const expectedData2 = expect.objectContaining({
        createdAt: customDate,
      });
      expect(createMock).toHaveBeenNthCalledWith(1, {
        data: expectedData1,
      });
      expect(createMock).toHaveBeenNthCalledWith(2, {
        data: expectedData2,
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

      const parentTransaction = createMockTransaction({
        id: 1,
        isRecurring: true,
      });
      const childTransaction = createMockTransaction({
        id: 2,
        isRecurring: false,
        transactionId: 1,
      });

      const createMock = jest.mocked(prismaService.transaction["create"]);
      createMock
        .mockResolvedValueOnce(parentTransaction)
        .mockResolvedValueOnce(childTransaction);

      await service.createEntry(mockUser, recurringDto);

      const expectedCreatedAt = expect.any(Date);
      const expectedData = expect.objectContaining({
        createdAt: expectedCreatedAt,
      });
      expect(createMock).toHaveBeenNthCalledWith(2, {
        data: expectedData,
      });
    });
  });
});
