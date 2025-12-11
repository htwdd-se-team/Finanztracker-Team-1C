import { createMock } from "@golevelup/ts-jest";
import { TestingModule } from "@nestjs/testing";
import {
  RecurringTransactionType,
  Transaction,
  TransactionType,
  User,
} from "@prisma/client";
import { DateTime } from "luxon";

import { BackendConfig } from "../src/backend.config";
import { Currency, ScheduledEntriesParamsDto } from "../src/dto";
import { KyselyService } from "../src/services/kysely.service";
import { PrismaService } from "../src/services/prisma.service";
import { RecurringEntryService } from "../src/services/recurring-entry.service";

import { createTestModule } from "./test-helpers";

describe("RecurringEntryService", () => {
  let module: TestingModule;
  let mockBackendConfig: BackendConfig;

  const mockUser: User = {
    id: 1,
    email: "test@example.com",
    passwordHash: "hashed",
    givenName: "Test",
    familyName: "User",
    createdAt: new Date("2024-01-01"),
  };

  const mockRecurringTransaction: Transaction = {
    id: 1,
    type: TransactionType.EXPENSE,
    amount: 1000,
    description: "Monthly Subscription",
    currency: Currency.EUR,
    userId: mockUser.id,
    categoryId: null,
    createdAt: new Date("2024-01-01"),
    isRecurring: true,
    recurringType: RecurringTransactionType.MONTHLY,
    recurringBaseInterval: 1,
    recurringDisabled: false,
    transactionId: null,
  };

  const createMockBackendConfig = (
    runScheduledEntries: boolean,
  ): BackendConfig => {
    return {
      RUN_SCHEDULED_ENTRIES: runScheduledEntries,
      CORS_ORIGIN: "http://localhost:*",
      DATABASE_URL: "postgresql://test",
      JWT_SECRET: "test-secret",
      JWT_EXPIRATION: "31d",
      PORT: 3111,
    } as unknown as BackendConfig;
  };

  const createMockKyselyService = (): KyselyService => {
    return {
      selectFrom: jest.fn(),
    } as unknown as KyselyService;
  };

  beforeAll(async () => {
    mockBackendConfig = createMockBackendConfig(true);

    const mockPrismaService = createMock<PrismaService>({
      transaction: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    } as unknown as PrismaService);

    // Mock KyselyService (even though not directly used, NestJS may try to resolve it)
    const mockKyselyService = {
      selectFrom: jest.fn(),
    } as unknown as KyselyService;

    module = await createTestModule({
      providers: [
        RecurringEntryService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: BackendConfig,
          useValue: mockBackendConfig,
        },
        {
          provide: KyselyService,
          useValue: mockKyselyService,
        },
      ],
    });

    // Service is created per test
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Spy on DateTime.now instead of mocking the entire module
    const nowDate = DateTime.fromJSDate(new Date());
    if (!nowDate.isValid) {
      throw new Error("Invalid DateTime created");
    }
    jest.spyOn(DateTime, "now").mockReturnValue(nowDate);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("getScheduledEntries", () => {
    it("should return active scheduled entries", async () => {
      const params: ScheduledEntriesParamsDto = {
        take: 10,
      };

      const entries = [mockRecurringTransaction];
      const mockFindMany = jest.fn().mockResolvedValue(entries);
      const mockPrismaService = createMock<PrismaService>({
        transaction: {
          findMany: mockFindMany,
        },
      } as unknown as PrismaService);

      const testModule = await createTestModule({
        providers: [
          RecurringEntryService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: BackendConfig,
            useValue: mockBackendConfig,
          },
          {
            provide: KyselyService,
            useValue: createMockKyselyService(),
          },
        ],
      });

      const testService = testModule.get<RecurringEntryService>(
        RecurringEntryService,
      );

      const result = await testService.getScheduledEntries(mockUser.id, params);

      expect(result.entries).toHaveLength(1);
      expect(result.count).toBe(1);
      expect(result.entries[0].isRecurring).toBe(true);
      expect(mockFindMany).toHaveBeenCalledWith({
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

      await testModule.close();
    });

    it("should return disabled scheduled entries when disabled=true", async () => {
      const params: ScheduledEntriesParamsDto = {
        take: 10,
        disabled: true,
      };

      const disabledEntry = {
        ...mockRecurringTransaction,
        recurringDisabled: true,
      };

      const mockFindMany = jest.fn().mockResolvedValue([disabledEntry]);
      const mockPrismaService = createMock<PrismaService>({
        transaction: {
          findMany: mockFindMany,
        },
      } as unknown as PrismaService);

      const testModule = await createTestModule({
        providers: [
          RecurringEntryService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: BackendConfig,
            useValue: mockBackendConfig,
          },
          {
            provide: KyselyService,
            useValue: createMockKyselyService(),
          },
        ],
      });

      const testService = testModule.get<RecurringEntryService>(
        RecurringEntryService,
      );

      const result = await testService.getScheduledEntries(mockUser.id, params);

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].recurringDisabled).toBe(true);
      expect(mockFindMany).toHaveBeenCalledWith({
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

      await testModule.close();
    });

    it("should handle pagination with cursor", async () => {
      const params: ScheduledEntriesParamsDto = {
        take: 10,
        cursorId: 5,
      };

      const entries = Array.from({ length: 10 }, (_, i) => ({
        ...mockRecurringTransaction,
        id: 6 + i,
      }));

      const mockFindMany = jest.fn().mockResolvedValue(entries);
      const mockPrismaService = createMock<PrismaService>({
        transaction: {
          findMany: mockFindMany,
        },
      } as unknown as PrismaService);

      const testModule = await createTestModule({
        providers: [
          RecurringEntryService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: BackendConfig,
            useValue: mockBackendConfig,
          },
          {
            provide: KyselyService,
            useValue: createMockKyselyService(),
          },
        ],
      });

      const testService = testModule.get<RecurringEntryService>(
        RecurringEntryService,
      );

      const result = await testService.getScheduledEntries(mockUser.id, params);

      expect(result.cursorId).toBe(15);
      expect(mockFindMany).toHaveBeenCalledWith({
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

      await testModule.close();
    });

    it("should set cursorId when entries match take limit", async () => {
      const params: ScheduledEntriesParamsDto = {
        take: 10,
      };

      const entries = Array.from({ length: 10 }, (_, i) => ({
        ...mockRecurringTransaction,
        id: i + 1,
      }));

      const mockFindMany = jest.fn().mockResolvedValue(entries);
      const mockPrismaService = createMock<PrismaService>({
        transaction: {
          findMany: mockFindMany,
        },
      } as unknown as PrismaService);

      const testModule = await createTestModule({
        providers: [
          RecurringEntryService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: BackendConfig,
            useValue: mockBackendConfig,
          },
          {
            provide: KyselyService,
            useValue: createMockKyselyService(),
          },
        ],
      });

      const testService = testModule.get<RecurringEntryService>(
        RecurringEntryService,
      );

      const result = await testService.getScheduledEntries(mockUser.id, params);

      expect(result.cursorId).toBe(10);

      await testModule.close();
    });

    it("should set cursorId to null when entries are less than take limit", async () => {
      const params: ScheduledEntriesParamsDto = {
        take: 10,
      };

      const entries = Array.from({ length: 5 }, (_, i) => ({
        ...mockRecurringTransaction,
        id: i + 1,
      }));

      const mockFindMany = jest.fn().mockResolvedValue(entries);
      const mockPrismaService = createMock<PrismaService>({
        transaction: {
          findMany: mockFindMany,
        },
      } as unknown as PrismaService);

      const testModule = await createTestModule({
        providers: [
          RecurringEntryService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: BackendConfig,
            useValue: mockBackendConfig,
          },
          {
            provide: KyselyService,
            useValue: createMockKyselyService(),
          },
        ],
      });

      const testService = testModule.get<RecurringEntryService>(
        RecurringEntryService,
      );

      const result = await testService.getScheduledEntries(mockUser.id, params);

      expect(result.cursorId).toBeNull();

      await testModule.close();
    });
  });

  describe("disableRecurringEntry", () => {
    it("should disable a recurring entry", async () => {
      const mockFindUnique = jest
        .fn()
        .mockResolvedValueOnce(mockRecurringTransaction)
        .mockResolvedValueOnce({
          ...mockRecurringTransaction,
          recurringDisabled: true,
        });
      const mockUpdate = jest.fn().mockResolvedValue({
        ...mockRecurringTransaction,
        recurringDisabled: true,
      });

      const mockPrismaService = createMock<PrismaService>({
        transaction: {
          findUnique: mockFindUnique,
          update: mockUpdate,
        },
      } as unknown as PrismaService);

      const testModule = await createTestModule({
        providers: [
          RecurringEntryService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: BackendConfig,
            useValue: mockBackendConfig,
          },
          {
            provide: KyselyService,
            useValue: createMockKyselyService(),
          },
        ],
      });

      const testService = testModule.get<RecurringEntryService>(
        RecurringEntryService,
      );

      const result = await testService.disableRecurringEntry(1, mockUser.id);

      expect(result.recurringDisabled).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { recurringDisabled: true },
      });

      await testModule.close();
    });

    it("should throw error if entry not found", async () => {
      const mockFindUnique = jest.fn().mockResolvedValue(null);
      const mockUpdate = jest.fn();

      const mockPrismaService = createMock<PrismaService>({
        transaction: {
          findUnique: mockFindUnique,
          update: mockUpdate,
        },
      } as unknown as PrismaService);

      const testModule = await createTestModule({
        providers: [
          RecurringEntryService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: BackendConfig,
            useValue: mockBackendConfig,
          },
          {
            provide: KyselyService,
            useValue: createMockKyselyService(),
          },
        ],
      });

      const testService = testModule.get<RecurringEntryService>(
        RecurringEntryService,
      );

      await expect(
        testService.disableRecurringEntry(999, mockUser.id),
      ).rejects.toThrow("Invalid recurring entry");
      expect(mockUpdate).not.toHaveBeenCalled();

      await testModule.close();
    });

    it("should throw error if entry belongs to different user", async () => {
      const differentUserEntry = {
        ...mockRecurringTransaction,
        userId: 999,
      };

      const mockFindUnique = jest.fn().mockResolvedValue(differentUserEntry);
      const mockUpdate = jest.fn();

      const mockPrismaService = createMock<PrismaService>({
        transaction: {
          findUnique: mockFindUnique,
          update: mockUpdate,
        },
      } as unknown as PrismaService);

      const testModule = await createTestModule({
        providers: [
          RecurringEntryService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: BackendConfig,
            useValue: mockBackendConfig,
          },
          {
            provide: KyselyService,
            useValue: createMockKyselyService(),
          },
        ],
      });

      const testService = testModule.get<RecurringEntryService>(
        RecurringEntryService,
      );

      await expect(
        testService.disableRecurringEntry(1, mockUser.id),
      ).rejects.toThrow("Invalid recurring entry");

      await testModule.close();
    });

    it("should throw error if entry is not recurring", async () => {
      const nonRecurringEntry = {
        ...mockRecurringTransaction,
        isRecurring: false,
      };

      const mockFindUnique = jest.fn().mockResolvedValue(nonRecurringEntry);
      const mockUpdate = jest.fn();

      const mockPrismaService = createMock<PrismaService>({
        transaction: {
          findUnique: mockFindUnique,
          update: mockUpdate,
        },
      } as unknown as PrismaService);

      const testModule = await createTestModule({
        providers: [
          RecurringEntryService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: BackendConfig,
            useValue: mockBackendConfig,
          },
          {
            provide: KyselyService,
            useValue: createMockKyselyService(),
          },
        ],
      });

      const testService = testModule.get<RecurringEntryService>(
        RecurringEntryService,
      );

      await expect(
        testService.disableRecurringEntry(1, mockUser.id),
      ).rejects.toThrow("Invalid recurring entry");

      await testModule.close();
    });
  });

  describe("enableRecurringEntry", () => {
    it("should enable a disabled recurring entry", async () => {
      const disabledEntry = {
        ...mockRecurringTransaction,
        recurringDisabled: true,
      };

      const mockFindUnique = jest
        .fn()
        .mockResolvedValueOnce(disabledEntry)
        .mockResolvedValueOnce({
          ...mockRecurringTransaction,
          recurringDisabled: false,
        });
      const mockUpdate = jest.fn().mockResolvedValue({
        ...mockRecurringTransaction,
        recurringDisabled: false,
      });

      const mockPrismaService = createMock<PrismaService>({
        transaction: {
          findUnique: mockFindUnique,
          update: mockUpdate,
        },
      } as unknown as PrismaService);

      const testModule = await createTestModule({
        providers: [
          RecurringEntryService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: BackendConfig,
            useValue: mockBackendConfig,
          },
          {
            provide: KyselyService,
            useValue: createMockKyselyService(),
          },
        ],
      });

      const testService = testModule.get<RecurringEntryService>(
        RecurringEntryService,
      );

      const result = await testService.enableRecurringEntry(1, mockUser.id);

      expect(result.recurringDisabled).toBe(false);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { recurringDisabled: false },
      });

      await testModule.close();
    });

    it("should throw error if entry not found", async () => {
      const mockFindUnique = jest.fn().mockResolvedValue(null);
      const mockUpdate = jest.fn();

      const mockPrismaService = createMock<PrismaService>({
        transaction: {
          findUnique: mockFindUnique,
          update: mockUpdate,
        },
      } as unknown as PrismaService);

      const testModule = await createTestModule({
        providers: [
          RecurringEntryService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: BackendConfig,
            useValue: mockBackendConfig,
          },
          {
            provide: KyselyService,
            useValue: createMockKyselyService(),
          },
        ],
      });

      const testService = testModule.get<RecurringEntryService>(
        RecurringEntryService,
      );

      await expect(
        testService.enableRecurringEntry(999, mockUser.id),
      ).rejects.toThrow("Invalid recurring entry");
      expect(mockUpdate).not.toHaveBeenCalled();

      await testModule.close();
    });
  });

  describe("processRecurringEntries", () => {
    it("should skip processing if RUN_SCHEDULED_ENTRIES is false", async () => {
      const config = createMockBackendConfig(false);

      const mockFindMany = jest.fn();
      // Access the prisma service from the module
      const testModule = await createTestModule({
        providers: [
          RecurringEntryService,
          {
            provide: PrismaService,
            useValue: createMock<PrismaService>({
              transaction: {
                findMany: mockFindMany,
              },
            } as unknown as PrismaService),
          },
          {
            provide: BackendConfig,
            useValue: config,
          },
          {
            provide: KyselyService,
            useValue: createMockKyselyService(),
          },
        ],
      });

      const serviceToTest = testModule.get<RecurringEntryService>(
        RecurringEntryService,
      );

      await serviceToTest.processRecurringEntries();

      expect(mockFindMany).not.toHaveBeenCalled();

      await testModule.close();
    });

    it("should process active recurring entries", async () => {
      const config = createMockBackendConfig(true);
      const parentEntries = [mockRecurringTransaction];

      const mockFindMany = jest.fn().mockResolvedValue(parentEntries);
      const mockFindUnique = jest
        .fn()
        .mockResolvedValue(mockRecurringTransaction);
      const mockFindFirst = jest.fn().mockResolvedValue(null);
      const mockCreate = jest.fn().mockResolvedValue({
        ...mockRecurringTransaction,
        id: 2,
        isRecurring: false,
        transactionId: 1,
      });

      // Mock DateTime.now() to return a date far enough in the future
      const futureDate = DateTime.fromJSDate(new Date("2024-02-15"));
      if (!futureDate.isValid) {
        throw new Error("Invalid DateTime created");
      }
      jest.spyOn(DateTime, "now").mockReturnValue(futureDate);

      const mockPrismaService = createMock<PrismaService>({
        transaction: {
          findMany: mockFindMany,
          findUnique: mockFindUnique,
          findFirst: mockFindFirst,
          create: mockCreate,
        },
      } as unknown as PrismaService);

      const testModule = await createTestModule({
        providers: [
          RecurringEntryService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: BackendConfig,
            useValue: config,
          },
          {
            provide: KyselyService,
            useValue: createMockKyselyService(),
          },
        ],
      });

      const serviceToTest = testModule.get<RecurringEntryService>(
        RecurringEntryService,
      );

      await serviceToTest.processRecurringEntries();

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          isRecurring: true,
          recurringDisabled: false,
          transactionId: null,
        },
      });

      await testModule.close();
    });

    it("should not create child if not enough time has passed", async () => {
      const config = createMockBackendConfig(true);
      const parentEntries = [mockRecurringTransaction];

      const mockFindMany = jest.fn().mockResolvedValue(parentEntries);
      const mockFindUnique = jest
        .fn()
        .mockResolvedValue(mockRecurringTransaction);
      const mockFindFirst = jest.fn().mockResolvedValue({
        ...mockRecurringTransaction,
        id: 2,
        createdAt: new Date("2024-01-15"),
      });
      const mockCreate = jest.fn();

      // Mock DateTime.now() to return a date that's not far enough
      const recentDate = DateTime.fromJSDate(new Date("2024-01-16"));
      if (!recentDate.isValid) {
        throw new Error("Invalid DateTime created");
      }
      jest.spyOn(DateTime, "now").mockReturnValue(recentDate);

      const mockPrismaService = createMock<PrismaService>({
        transaction: {
          findMany: mockFindMany,
          findUnique: mockFindUnique,
          findFirst: mockFindFirst,
          create: mockCreate,
        },
      } as unknown as PrismaService);

      const testModule = await createTestModule({
        providers: [
          RecurringEntryService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: BackendConfig,
            useValue: config,
          },
          {
            provide: KyselyService,
            useValue: createMockKyselyService(),
          },
        ],
      });

      const serviceToTest = testModule.get<RecurringEntryService>(
        RecurringEntryService,
      );

      await serviceToTest.processRecurringEntries();

      expect(mockCreate).not.toHaveBeenCalled();

      await testModule.close();
    });

    it("should create child for daily recurring entry when enough time has passed", async () => {
      const config = createMockBackendConfig(true);
      const dailyParent = {
        ...mockRecurringTransaction,
        recurringType: RecurringTransactionType.DAILY,
        createdAt: new Date("2024-01-01"),
      };

      const mockFindMany = jest.fn().mockResolvedValue([dailyParent]);
      const mockFindUnique = jest.fn().mockResolvedValue(dailyParent);
      const mockFindFirst = jest.fn().mockResolvedValue({
        ...dailyParent,
        id: 2,
        createdAt: new Date("2024-01-01"),
      });
      const mockCreate = jest.fn().mockResolvedValue({
        ...dailyParent,
        id: 3,
        isRecurring: false,
        transactionId: 1,
      });

      // Mock DateTime.now() to return a date far enough in the future for daily
      const futureDate = DateTime.fromJSDate(new Date("2024-01-03"));
      if (!futureDate.isValid) {
        throw new Error("Invalid DateTime created");
      }
      jest.spyOn(DateTime, "now").mockReturnValue(futureDate);

      const mockPrismaService = createMock<PrismaService>({
        transaction: {
          findMany: mockFindMany,
          findUnique: mockFindUnique,
          findFirst: mockFindFirst,
          create: mockCreate,
        },
      } as unknown as PrismaService);

      const testModule = await createTestModule({
        providers: [
          RecurringEntryService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: BackendConfig,
            useValue: config,
          },
          {
            provide: KyselyService,
            useValue: createMockKyselyService(),
          },
        ],
      });

      const serviceToTest = testModule.get<RecurringEntryService>(
        RecurringEntryService,
      );

      await serviceToTest.processRecurringEntries();

      expect(mockCreate).toHaveBeenCalled();

      await testModule.close();
    });

    it("should create child for weekly recurring entry when enough time has passed", async () => {
      const config = createMockBackendConfig(true);
      const weeklyParent = {
        ...mockRecurringTransaction,
        recurringType: RecurringTransactionType.WEEKLY,
        createdAt: new Date("2024-01-01"),
      };

      const mockFindMany = jest.fn().mockResolvedValue([weeklyParent]);
      const mockFindUnique = jest.fn().mockResolvedValue(weeklyParent);
      const mockFindFirst = jest.fn().mockResolvedValue({
        ...weeklyParent,
        id: 2,
        createdAt: new Date("2024-01-01"),
      });
      const mockCreate = jest.fn().mockResolvedValue({
        ...weeklyParent,
        id: 3,
        isRecurring: false,
        transactionId: 1,
      });

      // Mock DateTime.now() to return a date far enough in the future for weekly
      const futureDate = DateTime.fromJSDate(new Date("2024-01-15"));
      if (!futureDate.isValid) {
        throw new Error("Invalid DateTime created");
      }
      jest.spyOn(DateTime, "now").mockReturnValue(futureDate);

      const mockPrismaService = createMock<PrismaService>({
        transaction: {
          findMany: mockFindMany,
          findUnique: mockFindUnique,
          findFirst: mockFindFirst,
          create: mockCreate,
        },
      } as unknown as PrismaService);

      const testModule = await createTestModule({
        providers: [
          RecurringEntryService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: BackendConfig,
            useValue: config,
          },
          {
            provide: KyselyService,
            useValue: createMockKyselyService(),
          },
        ],
      });

      const serviceToTest = testModule.get<RecurringEntryService>(
        RecurringEntryService,
      );

      await serviceToTest.processRecurringEntries();

      expect(mockCreate).toHaveBeenCalled();

      await testModule.close();
    });

    it("should handle monthly recurring entry with interval > 1", async () => {
      const config = createMockBackendConfig(true);
      const monthlyParent = {
        ...mockRecurringTransaction,
        recurringType: RecurringTransactionType.MONTHLY,
        recurringBaseInterval: 2,
        createdAt: new Date("2024-01-01"),
      };

      const mockFindMany = jest.fn().mockResolvedValue([monthlyParent]);
      const mockFindUnique = jest.fn().mockResolvedValue(monthlyParent);
      const mockFindFirst = jest.fn().mockResolvedValue({
        ...monthlyParent,
        id: 2,
        createdAt: new Date("2024-01-01"),
      });
      const mockCreate = jest.fn().mockResolvedValue({
        ...monthlyParent,
        id: 3,
        isRecurring: false,
        transactionId: 1,
      });

      // Mock DateTime.now() to return a date far enough in the future for 2 months
      const futureDate = DateTime.fromJSDate(new Date("2024-03-15"));
      if (!futureDate.isValid) {
        throw new Error("Invalid DateTime created");
      }
      jest.spyOn(DateTime, "now").mockReturnValue(futureDate);

      const mockPrismaService = createMock<PrismaService>({
        transaction: {
          findMany: mockFindMany,
          findUnique: mockFindUnique,
          findFirst: mockFindFirst,
          create: mockCreate,
        },
      } as unknown as PrismaService);

      const testModule = await createTestModule({
        providers: [
          RecurringEntryService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: BackendConfig,
            useValue: config,
          },
          {
            provide: KyselyService,
            useValue: createMockKyselyService(),
          },
        ],
      });

      const serviceToTest = testModule.get<RecurringEntryService>(
        RecurringEntryService,
      );

      await serviceToTest.processRecurringEntries();

      expect(mockCreate).toHaveBeenCalled();

      await testModule.close();
    });

    it("should use parent createdAt when no child exists", async () => {
      const config = createMockBackendConfig(true);
      const parentCreatedAt = new Date("2024-01-01");
      const monthlyParent = {
        ...mockRecurringTransaction,
        recurringType: RecurringTransactionType.MONTHLY,
        createdAt: parentCreatedAt,
      };

      const mockFindMany = jest.fn().mockResolvedValue([monthlyParent]);
      const mockFindUnique = jest.fn().mockResolvedValue(monthlyParent);
      const mockFindFirst = jest.fn().mockResolvedValue(null);
      const mockCreate = jest.fn().mockResolvedValue({
        ...monthlyParent,
        id: 2,
        isRecurring: false,
        transactionId: 1,
      });

      // Mock DateTime.now() to return a date far enough in the future
      const futureDate = DateTime.fromJSDate(new Date("2024-02-15"));
      if (!futureDate.isValid) {
        throw new Error("Invalid DateTime created");
      }
      jest.spyOn(DateTime, "now").mockReturnValue(futureDate);

      const mockPrismaService = createMock<PrismaService>({
        transaction: {
          findMany: mockFindMany,
          findUnique: mockFindUnique,
          findFirst: mockFindFirst,
          create: mockCreate,
        },
      } as unknown as PrismaService);

      const testModule = await createTestModule({
        providers: [
          RecurringEntryService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: BackendConfig,
            useValue: config,
          },
          {
            provide: KyselyService,
            useValue: createMockKyselyService(),
          },
        ],
      });

      const serviceToTest = testModule.get<RecurringEntryService>(
        RecurringEntryService,
      );

      await serviceToTest.processRecurringEntries();

      expect(mockCreate).toHaveBeenCalled();

      await testModule.close();
    });

    it("should skip disabled recurring entries", async () => {
      const config = createMockBackendConfig(true);

      const mockFindMany = jest.fn().mockResolvedValue([]);

      const mockPrismaService = createMock<PrismaService>({
        transaction: {
          findMany: mockFindMany,
        },
      } as unknown as PrismaService);

      const testModule = await createTestModule({
        providers: [
          RecurringEntryService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: BackendConfig,
            useValue: config,
          },
          {
            provide: KyselyService,
            useValue: createMockKyselyService(),
          },
        ],
      });

      const serviceToTest = testModule.get<RecurringEntryService>(
        RecurringEntryService,
      );

      await serviceToTest.processRecurringEntries();

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          isRecurring: true,
          recurringDisabled: false,
          transactionId: null,
        },
      });

      await testModule.close();
    });

    it("should skip entry if parent is not found", async () => {
      const config = createMockBackendConfig(true);
      const parentEntries = [mockRecurringTransaction];

      const mockFindMany = jest.fn().mockResolvedValue(parentEntries);
      const mockFindUnique = jest.fn().mockResolvedValue(null);
      const mockCreate = jest.fn();

      const mockPrismaService = createMock<PrismaService>({
        transaction: {
          findMany: mockFindMany,
          findUnique: mockFindUnique,
          create: mockCreate,
        },
      } as unknown as PrismaService);

      const testModule = await createTestModule({
        providers: [
          RecurringEntryService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: BackendConfig,
            useValue: config,
          },
          {
            provide: KyselyService,
            useValue: createMockKyselyService(),
          },
        ],
      });

      const serviceToTest = testModule.get<RecurringEntryService>(
        RecurringEntryService,
      );

      await serviceToTest.processRecurringEntries();

      expect(mockCreate).not.toHaveBeenCalled();

      await testModule.close();
    });
  });
});
