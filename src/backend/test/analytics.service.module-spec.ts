import { TestingModule } from "@nestjs/testing";
import { TransactionType } from "@prisma/client";

import {
  TransactionBreakdownParamsDto,
  TransactionBalanceHistoryParamsDto,
  Granularity,
} from "../src/dto";
import { AnalyticsService } from "../src/services/analytics.service";
import { KyselyService } from "../src/services/kysely.service";
import { PrismaService } from "../src/services/prisma.service";

import { createMockUser } from "./mock-data-factory";
import { createMockPrismaService } from "./prisma-mock-factory";
import { createTestModule } from "./test-helpers";

describe("AnalyticsService", () => {
  let service: AnalyticsService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = createMockUser();

  const mockKyselyWithBuilder = {
    with: jest.fn().mockReturnThis(),
    selectFrom: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    crossJoin: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await createTestModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: KyselyService,
          useValue: mockKyselyWithBuilder,
        },
      ],
    });

    service = module.get<AnalyticsService>(AnalyticsService);
    prismaService = module.get<PrismaService>(
      PrismaService,
    ) as jest.Mocked<PrismaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getTransactionBreakdown", () => {
    const params: TransactionBreakdownParamsDto = {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      granularity: Granularity.DAY,
      withCategory: false,
    };

    it("should return transaction breakdown without categories", async () => {
      const mockResults = [
        {
          date: new Date("2024-01-01"),
          type: TransactionType.INCOME,
          value: "10000",
        },
        {
          date: new Date("2024-01-01"),
          type: TransactionType.EXPENSE,
          value: "5000",
        },
      ];

      mockKyselyWithBuilder.execute.mockResolvedValue(mockResults);

      const result = await service.getTransactionBreakdown(mockUser, params);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].type).toBe(TransactionType.INCOME);
      expect(result.data[0].value).toBe("10000");
      expect(result.data[0].category).toBeUndefined();
    });

    it("should return transaction breakdown with categories", async () => {
      const paramsWithCategory: TransactionBreakdownParamsDto = {
        ...params,
        withCategory: true,
      };

      const mockResults = [
        {
          date: new Date("2024-01-01"),
          type: TransactionType.EXPENSE,
          value: "5000",
          category: 1,
        },
      ];

      mockKyselyWithBuilder.execute.mockResolvedValue(mockResults);

      const result = await service.getTransactionBreakdown(
        mockUser,
        paramsWithCategory,
      );

      expect(result.data[0].category).toBe(1);
    });

    it("should handle different granularities", async () => {
      const weeklyParams: TransactionBreakdownParamsDto = {
        ...params,
        granularity: Granularity.WEEK,
      };

      mockKyselyWithBuilder.execute.mockResolvedValue([]);

      const result = await service.getTransactionBreakdown(
        mockUser,
        weeklyParams,
      );

      expect(mockKyselyWithBuilder.with).toHaveBeenCalled();
      expect(result.data).toEqual([]);
    });
  });

  describe("getTransactionBalanceHistory", () => {
    const params: TransactionBalanceHistoryParamsDto = {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      granularity: Granularity.MONTH,
    };

    it("should return balance history with cumulative balance", async () => {
      const mockResults = [
        {
          date: new Date("2024-01-01"),
          cumulative_balance: "5000",
        },
        {
          date: new Date("2024-02-01"),
          cumulative_balance: "10000",
        },
      ];

      mockKyselyWithBuilder.execute.mockResolvedValue(mockResults);

      const result = await service.getTransactionBalanceHistory(
        mockUser,
        params,
      );

      expect(result).toHaveLength(2);
      expect(result[0].value).toBe("5000");
      expect(result[1].value).toBe("10000");
    });

    it("should calculate initial balance before start date", async () => {
      mockKyselyWithBuilder.execute.mockResolvedValue([]);

      const result = await service.getTransactionBalanceHistory(
        mockUser,
        params,
      );

      expect(mockKyselyWithBuilder.with).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("should handle empty results", async () => {
      mockKyselyWithBuilder.execute.mockResolvedValue([]);

      const result = await service.getTransactionBalanceHistory(
        mockUser,
        params,
      );

      expect(result).toEqual([]);
    });
  });

  describe("getMaxTransactionAmountForUser", () => {
    it("should return maximum transaction amount rounded up", async () => {
      const aggregateMock = jest.mocked(prismaService.transaction["aggregate"]);
      aggregateMock.mockResolvedValue({
        _max: { amount: 1234 },
        _count: { id: 0 },
        _avg: { amount: null },
        _sum: { amount: null },
        _min: { amount: null },
      });

      const result = await service.getMaxTransactionAmountForUser(mockUser);

      expect(aggregateMock).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        _max: { amount: true },
      });
      expect(result).toBe(1300); // Rounded up to nearest 100
    });

    it("should return 0 when no transactions exist", async () => {
      const aggregateMock = jest.mocked(prismaService.transaction["aggregate"]);
      aggregateMock.mockResolvedValue({
        _max: { amount: null },
        _count: { id: 0 },
        _avg: { amount: null },
        _sum: { amount: null },
        _min: { amount: null },
      });

      const result = await service.getMaxTransactionAmountForUser(mockUser);

      expect(result).toBe(0);
    });

    it("should round up to nearest 100", async () => {
      const aggregateMock = jest.mocked(prismaService.transaction["aggregate"]);
      aggregateMock.mockResolvedValue({
        _max: { amount: 199 },
        _count: { id: 0 },
        _avg: { amount: null },
        _sum: { amount: null },
        _min: { amount: null },
      });

      const result = await service.getMaxTransactionAmountForUser(mockUser);

      expect(result).toBe(200);
    });

    it("should handle exact multiples of 100", async () => {
      const aggregateMock = jest.mocked(prismaService.transaction["aggregate"]);
      aggregateMock.mockResolvedValue({
        _max: { amount: 1000 },
        _count: { id: 0 },
        _avg: { amount: null },
        _sum: { amount: null },
        _min: { amount: null },
      });

      const result = await service.getMaxTransactionAmountForUser(mockUser);

      expect(result).toBe(1000);
    });
  });

  describe("getTransactionBreakdown - Granularity Tests", () => {
    const baseParams: TransactionBreakdownParamsDto = {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      granularity: Granularity.DAY,
      withCategory: false,
    };

    it("should handle DAY granularity", async () => {
      mockKyselyWithBuilder.execute.mockResolvedValue([
        {
          date: new Date("2024-01-01"),
          type: TransactionType.INCOME,
          value: "1000",
        },
      ]);

      const result = await service.getTransactionBreakdown(mockUser, {
        ...baseParams,
        granularity: Granularity.DAY,
      });

      expect(result.data).toHaveLength(1);
      expect(mockKyselyWithBuilder.with).toHaveBeenCalled();
    });

    it("should handle WEEK granularity", async () => {
      mockKyselyWithBuilder.execute.mockResolvedValue([]);

      await service.getTransactionBreakdown(mockUser, {
        ...baseParams,
        granularity: Granularity.WEEK,
      });

      expect(mockKyselyWithBuilder.with).toHaveBeenCalled();
    });

    it("should handle MONTH granularity", async () => {
      mockKyselyWithBuilder.execute.mockResolvedValue([]);

      await service.getTransactionBreakdown(mockUser, {
        ...baseParams,
        granularity: Granularity.MONTH,
      });

      expect(mockKyselyWithBuilder.with).toHaveBeenCalled();
    });

    it("should handle YEAR granularity", async () => {
      mockKyselyWithBuilder.execute.mockResolvedValue([]);

      await service.getTransactionBreakdown(mockUser, {
        ...baseParams,
        granularity: Granularity.YEAR,
      });

      expect(mockKyselyWithBuilder.with).toHaveBeenCalled();
    });

    it("should handle mixed transaction types in breakdown", async () => {
      const mockResults = [
        {
          date: new Date("2024-01-01"),
          type: TransactionType.INCOME,
          value: "10000",
        },
        {
          date: new Date("2024-01-01"),
          type: TransactionType.EXPENSE,
          value: "5000",
        },
      ];

      mockKyselyWithBuilder.execute.mockResolvedValue(mockResults);

      const result = await service.getTransactionBreakdown(
        mockUser,
        baseParams,
      );

      expect(result.data).toHaveLength(2);
      expect(result.data[0].type).toBe(TransactionType.INCOME);
      expect(result.data[1].type).toBe(TransactionType.EXPENSE);
    });
  });

  describe("getTransactionBalanceHistory - Granularity Tests", () => {
    const baseParams: TransactionBalanceHistoryParamsDto = {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      granularity: Granularity.DAY,
    };

    it("should handle DAY granularity", async () => {
      mockKyselyWithBuilder.execute.mockResolvedValue([
        {
          date: new Date("2024-01-01"),
          cumulative_balance: "1000",
        },
      ]);

      const result = await service.getTransactionBalanceHistory(mockUser, {
        ...baseParams,
        granularity: Granularity.DAY,
      });

      expect(result).toHaveLength(1);
      expect(mockKyselyWithBuilder.with).toHaveBeenCalled();
    });

    it("should handle WEEK granularity", async () => {
      mockKyselyWithBuilder.execute.mockResolvedValue([]);

      await service.getTransactionBalanceHistory(mockUser, {
        ...baseParams,
        granularity: Granularity.WEEK,
      });

      expect(mockKyselyWithBuilder.with).toHaveBeenCalled();
    });

    it("should handle MONTH granularity", async () => {
      mockKyselyWithBuilder.execute.mockResolvedValue([]);

      await service.getTransactionBalanceHistory(mockUser, {
        ...baseParams,
        granularity: Granularity.MONTH,
      });

      expect(mockKyselyWithBuilder.with).toHaveBeenCalled();
    });

    it("should handle YEAR granularity", async () => {
      mockKyselyWithBuilder.execute.mockResolvedValue([]);

      await service.getTransactionBalanceHistory(mockUser, {
        ...baseParams,
        granularity: Granularity.YEAR,
      });

      expect(mockKyselyWithBuilder.with).toHaveBeenCalled();
    });

    it("should handle cumulative balance calculation correctly", async () => {
      const mockResults = [
        {
          date: new Date("2024-01-01"),
          cumulative_balance: "1000",
        },
        {
          date: new Date("2024-01-02"),
          cumulative_balance: "2500",
        },
        {
          date: new Date("2024-01-03"),
          cumulative_balance: "3000",
        },
      ];

      mockKyselyWithBuilder.execute.mockResolvedValue(mockResults);

      const result = await service.getTransactionBalanceHistory(
        mockUser,
        baseParams,
      );

      expect(result).toHaveLength(3);
      expect(result[0].value).toBe("1000");
      expect(result[1].value).toBe("2500");
      expect(result[2].value).toBe("3000");
    });
  });
});
