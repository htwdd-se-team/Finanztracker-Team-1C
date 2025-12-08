import { Test, TestingModule } from "@nestjs/testing";
import {
  Transaction,
  TransactionType,
  RecurringTransactionType,
  User,
} from "@prisma/client";

import { Currency } from "../src/dto";
import { DateTime } from "luxon";

import { ScheduledEntriesParamsDto } from "../src/dto";
import { BackendConfig } from "../src/backend.config";
import { RecurringEntryService } from "../src/services/recurring-entry.service";
import { PrismaService } from "../src/services/prisma.service";

import { createTestModule } from "./test-helpers";

describe("RecurringEntryService", () => {
  let service: RecurringEntryService;
  let prismaService: PrismaService;
  let backendConfig: BackendConfig;

  const mockUser: User = {
    id: 1,
    email: "test@example.com",
    passwordHash: "hashedPassword",
    givenName: "Test",
    familyName: "User",
    createdAt: new Date(),
  };

  const mockParentTransaction: Transaction = {
    id: 1,
    type: TransactionType.EXPENSE,
    amount: 1000,
    description: "Monthly subscription",
    currency: Currency.EUR,
    userId: mockUser.id,
    categoryId: null,
    createdAt: DateTime.now().minus({ months: 1 }).toJSDate(),
    isRecurring: true,
    recurringType: RecurringTransactionType.MONTHLY,
    recurringBaseInterval: 1,
    recurringDisabled: false,
    transactionId: null,
  };

  const mockChildTransaction: Transaction = {
    id: 2,
    type: TransactionType.EXPENSE,
    amount: 1000,
    description: "Monthly subscription",
    currency: Currency.EUR,
    userId: mockUser.id,
    categoryId: null,
    createdAt: DateTime.now().minus({ days: 15 }).toJSDate(),
    isRecurring: false,
    recurringType: null,
    recurringBaseInterval: null,
    recurringDisabled: null,
    transactionId: 1,
  };

  beforeEach(async () => {
    const mockBackendConfig = {
      CORS_ORIGIN: "http://localhost:*",
      DATABASE_URL: "postgresql://dummy:dummy@localhost:5432/dummy",
      JWT_SECRET: "test-secret",
      JWT_EXPIRATION: "31d",
      RUN_SCHEDULED_ENTRIES: true,
      PORT: 3111,
    };

    const module: TestingModule = await createTestModule({
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
          useValue: mockBackendConfig,
        },
      ],
    });

    service = module.get<RecurringEntryService>(RecurringEntryService);
    prismaService = module.get<PrismaService>(PrismaService);
    backendConfig = module.get<BackendConfig>(BackendConfig);
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
      jest
        .spyOn(prismaService.transaction, "findMany")
        .mockResolvedValue([mockParentTransaction]);

      const result = await service.getScheduledEntries(mockUser.id, params);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
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
      const disabledParent = {
        ...mockParentTransaction,
        recurringDisabled: true,
      };

      jest
        .spyOn(prismaService.transaction, "findMany")
        .mockResolvedValue([disabledParent]);

      const paramsDisabled: ScheduledEntriesParamsDto = {
        disabled: true,
        take: 10,
      };

      const result = await service.getScheduledEntries(mockUser.id, paramsDisabled);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
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
      jest
        .spyOn(prismaService.transaction, "findMany")
        .mockResolvedValue([mockParentTransaction]);

      const paramsWithCursor: ScheduledEntriesParamsDto = {
        ...params,
        cursorId: 5,
      };

      await service.getScheduledEntries(mockUser.id, paramsWithCursor);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
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
      const manyEntries = Array.from({ length: 10 }, (_, i) => ({
        ...mockParentTransaction,
        id: i + 1,
      }));

      jest
        .spyOn(prismaService.transaction, "findMany")
        .mockResolvedValue(manyEntries);

      const result = await service.getScheduledEntries(mockUser.id, params);

      expect(result.cursorId).toBe(10);
    });

    it("should set cursorId to null when entries are less than take limit", async () => {
      jest
        .spyOn(prismaService.transaction, "findMany")
        .mockResolvedValue([mockParentTransaction]);

      const result = await service.getScheduledEntries(mockUser.id, params);

      expect(result.cursorId).toBeNull();
    });
  });

  describe("disableRecurringEntry", () => {
    it("should disable a recurring entry", async () => {
      jest
        .spyOn(prismaService.transaction, "findUnique")
        .mockResolvedValueOnce(mockParentTransaction)
        .mockResolvedValueOnce({
          ...mockParentTransaction,
          recurringDisabled: true,
        });
      jest
        .spyOn(prismaService.transaction, "update")
        .mockResolvedValue({
          ...mockParentTransaction,
          recurringDisabled: true,
        });

      const result = await service.disableRecurringEntry(1, mockUser.id);

      expect(prismaService.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { recurringDisabled: true },
      });
      expect(result.recurringDisabled).toBe(true);
    });

    it("should throw error if entry not found", async () => {
      jest.spyOn(prismaService.transaction, "findUnique").mockResolvedValue(null);

      await expect(
        service.disableRecurringEntry(999, mockUser.id),
      ).rejects.toThrow("Invalid recurring entry");
    });

    it("should throw error if entry belongs to different user", async () => {
      const otherUserTransaction = {
        ...mockParentTransaction,
        userId: 999,
      };

      jest
        .spyOn(prismaService.transaction, "findUnique")
        .mockResolvedValue(otherUserTransaction);

      await expect(
        service.disableRecurringEntry(1, mockUser.id),
      ).rejects.toThrow("Invalid recurring entry");
    });

    it("should throw error if entry is not recurring", async () => {
      const nonRecurringTransaction = {
        ...mockParentTransaction,
        isRecurring: false,
      };

      jest
        .spyOn(prismaService.transaction, "findUnique")
        .mockResolvedValue(nonRecurringTransaction);

      await expect(
        service.disableRecurringEntry(1, mockUser.id),
      ).rejects.toThrow("Invalid recurring entry");
    });
  });

  describe("enableRecurringEntry", () => {
    it("should enable a disabled recurring entry", async () => {
      const disabledParent = {
        ...mockParentTransaction,
        recurringDisabled: true,
      };

      jest
        .spyOn(prismaService.transaction, "findUnique")
        .mockResolvedValueOnce(disabledParent)
        .mockResolvedValueOnce({
          ...disabledParent,
          recurringDisabled: false,
        });
      jest
        .spyOn(prismaService.transaction, "update")
        .mockResolvedValue({
          ...disabledParent,
          recurringDisabled: false,
        });

      const result = await service.enableRecurringEntry(1, mockUser.id);

      expect(prismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { recurringDisabled: false },
      });
      expect(result.recurringDisabled).toBe(false);
    });

    it("should throw error if entry not found", async () => {
      jest.spyOn(prismaService.transaction, "findUnique").mockResolvedValue(null);

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

      const serviceWithDisabled = moduleWithDisabledConfig.get<RecurringEntryService>(
        RecurringEntryService,
      );

      await serviceWithDisabled.processRecurringEntries();

      expect(prismaService.transaction.findMany).not.toHaveBeenCalled();
    });

    it("should process active recurring entries", async () => {

      jest
        .spyOn(prismaService.transaction, "findMany")
        .mockResolvedValue([mockParentTransaction]);
      jest
        .spyOn(prismaService.transaction, "findFirst")
        .mockResolvedValue(mockChildTransaction);
      jest
        .spyOn(prismaService.transaction, "create")
        .mockResolvedValue(mockChildTransaction);

      await service.processRecurringEntries();

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
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

      jest
        .spyOn(prismaService.transaction, "findMany")
        .mockResolvedValue([mockParentTransaction]);
      jest
        .spyOn(prismaService.transaction, "findFirst")
        .mockResolvedValue(recentChild);

      await service.processRecurringEntries();

      expect(prismaService.transaction.create).not.toHaveBeenCalled();
    });

    it("should create child for daily recurring entry when enough time has passed", async () => {
      const dailyParent = {
        ...mockParentTransaction,
        id: 1,
        recurringType: RecurringTransactionType.DAILY,
        recurringBaseInterval: 1,
        createdAt: DateTime.now().minus({ days: 5 }).toJSDate(),
      };
      const oldChild = {
        ...mockChildTransaction,
        createdAt: DateTime.now().minus({ days: 2 }).toJSDate(),
      };

      jest
        .spyOn(prismaService.transaction, "findMany")
        .mockResolvedValue([dailyParent]);
      jest
        .spyOn(prismaService.transaction, "findFirst")
        .mockResolvedValue(oldChild);
      jest
        .spyOn(prismaService.transaction, "findUnique")
        .mockResolvedValue(dailyParent);
      jest
        .spyOn(prismaService.transaction, "create")
        .mockResolvedValue(mockChildTransaction);

      await service.processRecurringEntries();

      expect(prismaService.transaction.create).toHaveBeenCalled();
    });

    it("should create child for weekly recurring entry when enough time has passed", async () => {
      const weeklyParent = {
        ...mockParentTransaction,
        id: 1,
        recurringType: RecurringTransactionType.WEEKLY,
        recurringBaseInterval: 1,
        createdAt: DateTime.now().minus({ weeks: 5 }).toJSDate(),
      };
      const oldChild = {
        ...mockChildTransaction,
        createdAt: DateTime.now().minus({ weeks: 2 }).toJSDate(),
      };

      jest
        .spyOn(prismaService.transaction, "findMany")
        .mockResolvedValue([weeklyParent]);
      jest
        .spyOn(prismaService.transaction, "findFirst")
        .mockResolvedValue(oldChild);
      jest
        .spyOn(prismaService.transaction, "findUnique")
        .mockResolvedValue(weeklyParent);
      jest
        .spyOn(prismaService.transaction, "create")
        .mockResolvedValue(mockChildTransaction);

      await service.processRecurringEntries();

      expect(prismaService.transaction.create).toHaveBeenCalled();
    });

    it("should handle monthly recurring entry with interval > 1", async () => {
      const monthlyParent = {
        ...mockParentTransaction,
        id: 1,
        recurringType: RecurringTransactionType.MONTHLY,
        recurringBaseInterval: 2, // Every 2 months
        createdAt: DateTime.now().minus({ months: 6 }).toJSDate(),
      };
      const oldChild = {
        ...mockChildTransaction,
        createdAt: DateTime.now().minus({ months: 3 }).toJSDate(),
      };

      jest
        .spyOn(prismaService.transaction, "findMany")
        .mockResolvedValue([monthlyParent]);
      jest
        .spyOn(prismaService.transaction, "findFirst")
        .mockResolvedValue(oldChild);
      jest
        .spyOn(prismaService.transaction, "findUnique")
        .mockResolvedValue(monthlyParent);
      jest
        .spyOn(prismaService.transaction, "create")
        .mockResolvedValue(mockChildTransaction);

      await service.processRecurringEntries();

      expect(prismaService.transaction.create).toHaveBeenCalled();
    });

    it("should use parent createdAt when no child exists", async () => {
      const parentWithoutChild = {
        ...mockParentTransaction,
        id: 1,
        createdAt: DateTime.now().minus({ months: 2 }).toJSDate(),
      };

      jest
        .spyOn(prismaService.transaction, "findMany")
        .mockResolvedValue([parentWithoutChild]);
      jest
        .spyOn(prismaService.transaction, "findFirst")
        .mockResolvedValue(null);
      jest
        .spyOn(prismaService.transaction, "findUnique")
        .mockResolvedValue(parentWithoutChild);
      jest
        .spyOn(prismaService.transaction, "create")
        .mockResolvedValue(mockChildTransaction);

      await service.processRecurringEntries();

      expect(prismaService.transaction.create).toHaveBeenCalled();
    });

    it("should skip disabled recurring entries", async () => {
      const disabledParent = {
        ...mockParentTransaction,
        recurringDisabled: true,
      };

      jest
        .spyOn(prismaService.transaction, "findMany")
        .mockResolvedValue([disabledParent]);

      await service.processRecurringEntries();

      expect(prismaService.transaction.findFirst).not.toHaveBeenCalled();
    });

    it("should skip entry if parent is not found", async () => {
      jest
        .spyOn(prismaService.transaction, "findMany")
        .mockResolvedValue([mockParentTransaction]);
      jest
        .spyOn(prismaService.transaction, "findFirst")
        .mockResolvedValue(null);
      jest
        .spyOn(prismaService.transaction, "findUnique")
        .mockResolvedValue(null);

      await service.processRecurringEntries();

      expect(prismaService.transaction.create).not.toHaveBeenCalled();
    });
  });
});

