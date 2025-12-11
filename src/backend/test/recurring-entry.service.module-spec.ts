import { TestingModule } from "@nestjs/testing";
import { RecurringTransactionType } from "@prisma/client";
import { DateTime } from "luxon";

import { BackendConfig } from "../src/backend.config";
import { ScheduledEntriesParamsDto } from "../src/dto";
import { PrismaService } from "../src/services/prisma.service";
import { RecurringEntryService } from "../src/services/recurring-entry.service";

import { createMockUser, createMockTransaction } from "./mock-data-factory";
import { createMockPrismaService } from "./prisma-mock-factory";
import { createTestModule } from "./test-helpers";

describe("RecurringEntryService", () => {
  let service: RecurringEntryService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = createMockUser();

  const mockParentTransaction = createMockTransaction({
    id: 1,
    userId: mockUser.id,
    createdAt: DateTime.now().minus({ months: 1 }).toJSDate(),
    isRecurring: true,
    recurringType: RecurringTransactionType.MONTHLY,
    recurringBaseInterval: 1,
    recurringDisabled: false,
    transactionId: null,
  });

  const mockChildTransaction = createMockTransaction({
    id: 2,
    userId: mockUser.id,
    createdAt: DateTime.now().minus({ days: 15 }).toJSDate(),
    isRecurring: false,
    recurringType: null,
    recurringBaseInterval: null,
    recurringDisabled: null,
    transactionId: 1,
  });

  beforeEach(async () => {
    const mockBackendConfig = {
      CORS_ORIGIN: "http://localhost:*",
      DATABASE_URL: "postgresql://dummy:dummy@localhost:5432/dummy",
      JWT_SECRET: "test-secret",
      JWT_EXPIRATION: "31d",
      RUN_SCHEDULED_ENTRIES: true,
      PORT: 3111,
    };

    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await createTestModule({
      providers: [
        RecurringEntryService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: BackendConfig,
          useValue: mockBackendConfig,
        },
      ],
    });

    service = module.get<RecurringEntryService>(RecurringEntryService);
    prismaService = module.get<PrismaService>(
      PrismaService,
    ) as jest.Mocked<PrismaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getScheduledEntries", () => {
    const params: ScheduledEntriesParamsDto = {
      disabled: false,
      take: 10,
    };

    it("should return active scheduled entries", async () => {
      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      findManyMock.mockResolvedValue([mockParentTransaction]);

      const result = await service.getScheduledEntries(mockUser.id, params);

      expect(findManyMock).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          isRecurring: true,
          recurringDisabled: false,
        },
        take: 10,
        orderBy: {
          amount: "desc",
        },
      });
      expect(result.entries).toHaveLength(1);
      expect(result.count).toBe(1);
    });

    it("should return disabled scheduled entries when disabled=true", async () => {
      const disabledParent = createMockTransaction({
        ...mockParentTransaction,
        recurringDisabled: true,
      });

      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      findManyMock.mockResolvedValue([disabledParent]);

      const paramsDisabled: ScheduledEntriesParamsDto = {
        disabled: true,
        take: 10,
      };

      const result = await service.getScheduledEntries(
        mockUser.id,
        paramsDisabled,
      );

      expect(findManyMock).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          isRecurring: true,
          recurringDisabled: true,
        },
        take: 10,
        orderBy: {
          amount: "desc",
        },
      });
      expect(result.entries).toHaveLength(1);
    });

    it("should handle pagination with cursor", async () => {
      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      findManyMock.mockResolvedValue([mockParentTransaction]);

      const paramsWithCursor: ScheduledEntriesParamsDto = {
        ...params,
        cursorId: 5,
      };

      await service.getScheduledEntries(mockUser.id, paramsWithCursor);

      expect(findManyMock).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          isRecurring: true,
          recurringDisabled: false,
        },
        cursor: { id: 5 },
        skip: 1,
        take: 10,
        orderBy: {
          amount: "desc",
        },
      });
    });

    it("should set cursorId when entries match take limit", async () => {
      const manyEntries = Array.from({ length: 10 }, (_, i) =>
        createMockTransaction({ ...mockParentTransaction, id: i + 1 }),
      );

      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      findManyMock.mockResolvedValue(manyEntries);

      const result = await service.getScheduledEntries(mockUser.id, params);

      expect(result.cursorId).toBe(10);
    });

    it("should set cursorId to null when entries are less than take limit", async () => {
      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      findManyMock.mockResolvedValue([mockParentTransaction]);

      const result = await service.getScheduledEntries(mockUser.id, params);

      expect(result.cursorId).toBeNull();
    });
  });

  describe("disableRecurringEntry", () => {
    it("should disable a recurring entry", async () => {
      const findUniqueMock = jest.mocked(
        prismaService.transaction["findUnique"],
      );
      const updateMock = jest.mocked(prismaService.transaction["update"]);
      findUniqueMock
        .mockResolvedValueOnce(mockParentTransaction)
        .mockResolvedValueOnce(
          createMockTransaction({
            ...mockParentTransaction,
            recurringDisabled: true,
          }),
        );
      updateMock.mockResolvedValue(
        createMockTransaction({
          ...mockParentTransaction,
          recurringDisabled: true,
        }),
      );

      const result = await service.disableRecurringEntry(1, mockUser.id);

      expect(findUniqueMock).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { recurringDisabled: true },
      });
      expect(result.recurringDisabled).toBe(true);
    });

    it("should throw error if entry not found", async () => {
      jest
        .spyOn(prismaService.transaction, "findUnique")
        .mockResolvedValue(null);

      await expect(
        service.disableRecurringEntry(999, mockUser.id),
      ).rejects.toThrow("Invalid recurring entry");
    });

    it("should throw error if entry belongs to different user", async () => {
      const otherUserTransaction = createMockTransaction({
        ...mockParentTransaction,
        userId: 999,
      });

      const findUniqueMock = jest.mocked(
        prismaService.transaction["findUnique"],
      );
      findUniqueMock.mockResolvedValue(otherUserTransaction);

      await expect(
        service.disableRecurringEntry(1, mockUser.id),
      ).rejects.toThrow("Invalid recurring entry");
    });

    it("should throw error if entry is not recurring", async () => {
      const nonRecurringTransaction = createMockTransaction({
        ...mockParentTransaction,
        isRecurring: false,
      });

      const findUniqueMock = jest.mocked(
        prismaService.transaction["findUnique"],
      );
      findUniqueMock.mockResolvedValue(nonRecurringTransaction);

      await expect(
        service.disableRecurringEntry(1, mockUser.id),
      ).rejects.toThrow("Invalid recurring entry");
    });
  });

  describe("enableRecurringEntry", () => {
    it("should enable a disabled recurring entry", async () => {
      const disabledParent = createMockTransaction({
        ...mockParentTransaction,
        recurringDisabled: true,
      });

      const findUniqueMock = jest.mocked(
        prismaService.transaction["findUnique"],
      );
      const updateMock = jest.mocked(prismaService.transaction["update"]);
      findUniqueMock
        .mockResolvedValueOnce(disabledParent)
        .mockResolvedValueOnce(
          createMockTransaction({
            ...disabledParent,
            recurringDisabled: false,
          }),
        );
      updateMock.mockResolvedValue(
        createMockTransaction({
          ...disabledParent,
          recurringDisabled: false,
        }),
      );

      const result = await service.enableRecurringEntry(1, mockUser.id);

      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { recurringDisabled: false },
      });
      expect(result.recurringDisabled).toBe(false);
    });

    it("should throw error if entry not found", async () => {
      jest
        .spyOn(prismaService.transaction, "findUnique")
        .mockResolvedValue(null);

      await expect(
        service.enableRecurringEntry(999, mockUser.id),
      ).rejects.toThrow("Invalid recurring entry");
    });
  });

  describe("processRecurringEntries", () => {
    it("should skip processing if RUN_SCHEDULED_ENTRIES is false", async () => {
      const disabledConfig = {
        CORS_ORIGIN: "http://localhost:*",
        DATABASE_URL: "postgresql://dummy:dummy@localhost:5432/dummy",
        JWT_SECRET: "test-secret",
        JWT_EXPIRATION: "31d",
        RUN_SCHEDULED_ENTRIES: false,
        PORT: 3111,
      };

      const moduleWithDisabledConfig: TestingModule = await createTestModule({
        providers: [
          RecurringEntryService,
          {
            provide: PrismaService,
            useValue: {
              transaction: {
                findMany: jest.fn(),
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
              },
            },
          },
          {
            provide: BackendConfig,
            useValue: disabledConfig,
          },
        ],
      });

      const serviceWithDisabled =
        moduleWithDisabledConfig.get<RecurringEntryService>(
          RecurringEntryService,
        );

      await serviceWithDisabled.processRecurringEntries();

      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      expect(findManyMock).not.toHaveBeenCalled();
    });

    it("should process active recurring entries", async () => {
      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      findManyMock.mockResolvedValue([mockParentTransaction]);
      const findFirstMock = jest.mocked(prismaService.transaction["findFirst"]);
      findFirstMock.mockResolvedValue(mockChildTransaction);
      const createMock = jest.mocked(prismaService.transaction["create"]);
      createMock.mockResolvedValue(mockChildTransaction);

      await service.processRecurringEntries();

      expect(findManyMock).toHaveBeenCalledWith({
        where: {
          isRecurring: true,
          recurringDisabled: false,
          transactionId: null,
        },
      });
    });

    it("should not create child if not enough time has passed", async () => {
      const recentChild = {
        ...mockChildTransaction,
        createdAt: DateTime.now().minus({ days: 1 }).toJSDate(),
      };

      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      const findFirstMock = jest.mocked(prismaService.transaction["findFirst"]);
      findManyMock.mockResolvedValue([mockParentTransaction]);
      findFirstMock.mockResolvedValue(recentChild);

      await service.processRecurringEntries();

      const createMock = jest.mocked(prismaService.transaction["create"]);
      expect(createMock).not.toHaveBeenCalled();
    });

    it("should create child for daily recurring entry when enough time has passed", async () => {
      const dailyParent = createMockTransaction({
        ...mockParentTransaction,
        id: 1,
        recurringType: RecurringTransactionType.DAILY,
        recurringBaseInterval: 1,
        createdAt: DateTime.now().minus({ days: 5 }).toJSDate(),
      });
      const oldChild = createMockTransaction({
        ...mockChildTransaction,
        createdAt: DateTime.now().minus({ days: 2 }).toJSDate(),
      });

      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      const findFirstMock = jest.mocked(prismaService.transaction["findFirst"]);
      const findUniqueMock = jest.mocked(
        prismaService.transaction["findUnique"],
      );
      const createMock = jest.mocked(prismaService.transaction["create"]);
      findManyMock.mockResolvedValue([dailyParent]);
      findFirstMock.mockResolvedValue(oldChild);
      findUniqueMock.mockResolvedValue(dailyParent);
      createMock.mockResolvedValue(mockChildTransaction);

      await service.processRecurringEntries();

      expect(createMock).toHaveBeenCalled();
    });

    it("should create child for weekly recurring entry when enough time has passed", async () => {
      const weeklyParent = createMockTransaction({
        ...mockParentTransaction,
        id: 1,
        recurringType: RecurringTransactionType.WEEKLY,
        recurringBaseInterval: 1,
        createdAt: DateTime.now().minus({ weeks: 5 }).toJSDate(),
      });
      const oldChild = createMockTransaction({
        ...mockChildTransaction,
        createdAt: DateTime.now().minus({ weeks: 2 }).toJSDate(),
      });

      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      const findFirstMock = jest.mocked(prismaService.transaction["findFirst"]);
      const findUniqueMock = jest.mocked(
        prismaService.transaction["findUnique"],
      );
      const createMock = jest.mocked(prismaService.transaction["create"]);
      findManyMock.mockResolvedValue([weeklyParent]);
      findFirstMock.mockResolvedValue(oldChild);
      findUniqueMock.mockResolvedValue(weeklyParent);
      createMock.mockResolvedValue(mockChildTransaction);

      await service.processRecurringEntries();

      expect(createMock).toHaveBeenCalled();
    });

    it("should handle monthly recurring entry with interval > 1", async () => {
      const monthlyParent = createMockTransaction({
        ...mockParentTransaction,
        id: 1,
        recurringType: RecurringTransactionType.MONTHLY,
        recurringBaseInterval: 2, // Every 2 months
        createdAt: DateTime.now().minus({ months: 6 }).toJSDate(),
      });
      const oldChild = createMockTransaction({
        ...mockChildTransaction,
        createdAt: DateTime.now().minus({ months: 3 }).toJSDate(),
      });

      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      const findFirstMock = jest.mocked(prismaService.transaction["findFirst"]);
      const findUniqueMock = jest.mocked(
        prismaService.transaction["findUnique"],
      );
      const createMock = jest.mocked(prismaService.transaction["create"]);
      findManyMock.mockResolvedValue([monthlyParent]);
      findFirstMock.mockResolvedValue(oldChild);
      findUniqueMock.mockResolvedValue(monthlyParent);
      createMock.mockResolvedValue(mockChildTransaction);

      await service.processRecurringEntries();

      expect(createMock).toHaveBeenCalled();
    });

    it("should use parent createdAt when no child exists", async () => {
      const parentWithoutChild = createMockTransaction({
        ...mockParentTransaction,
        id: 1,
        createdAt: DateTime.now().minus({ months: 2 }).toJSDate(),
      });

      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      const findFirstMock = jest.mocked(prismaService.transaction["findFirst"]);
      const findUniqueMock = jest.mocked(
        prismaService.transaction["findUnique"],
      );
      const createMock = jest.mocked(prismaService.transaction["create"]);
      findManyMock.mockResolvedValue([parentWithoutChild]);
      findFirstMock.mockResolvedValue(null);
      findUniqueMock.mockResolvedValue(parentWithoutChild);
      createMock.mockResolvedValue(mockChildTransaction);

      await service.processRecurringEntries();

      expect(createMock).toHaveBeenCalled();
    });

    it("should skip disabled recurring entries", async () => {
      const disabledParent = createMockTransaction({
        ...mockParentTransaction,
        recurringDisabled: true,
      });

      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      const findFirstMock = jest.mocked(prismaService.transaction["findFirst"]);
      findManyMock.mockResolvedValue([disabledParent]);
      findFirstMock.mockResolvedValue(null);

      await service.processRecurringEntries();

      expect(findFirstMock).not.toHaveBeenCalled();
    });

    it("should skip entry if parent is not found", async () => {
      const findManyMock = jest.mocked(prismaService.transaction["findMany"]);
      const findFirstMock = jest.mocked(prismaService.transaction["findFirst"]);
      const findUniqueMock = jest.mocked(
        prismaService.transaction["findUnique"],
      );
      const createMock = jest.mocked(prismaService.transaction["create"]);
      findManyMock.mockResolvedValue([mockParentTransaction]);
      findFirstMock.mockResolvedValue(null);
      findUniqueMock.mockResolvedValue(null);

      await service.processRecurringEntries();

      expect(createMock).not.toHaveBeenCalled();
    });
  });
});
