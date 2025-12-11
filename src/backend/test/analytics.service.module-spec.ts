import { TestingModule } from "@nestjs/testing";
import { TransactionType, User } from "@prisma/client";

import {
  Granularity,
  TransactionBreakdownParamsDto,
  TransactionBalanceHistoryParamsDto,
} from "../src/dto";
import { AnalyticsService } from "../src/services/analytics.service";
import { KyselyService } from "../src/services/kysely.service";
import { PrismaService } from "../src/services/prisma.service";

import { createTestModule } from "./test-helpers";

describe("AnalyticsService", () => {
  let service: AnalyticsService;
  let module: TestingModule;
  let mockKyselyWith: jest.Mock;
  let mockKyselySelectFrom: jest.Mock;
  let mockKyselyExecute: jest.Mock;
  let mockTransactionAggregate: jest.Mock;

  const mockUser: User = {
    id: 1,
    email: "test@example.com",
    passwordHash: "hashed",
    givenName: "Test",
    familyName: "User",
    createdAt: new Date("2024-01-01"),
  };

  beforeAll(async () => {
    mockKyselyExecute = jest.fn();
    mockTransactionAggregate = jest.fn();

    const createKyselyChain = () => {
      const chain = {
        with: jest.fn().mockImplementation(() => chain),
        selectFrom: jest.fn().mockImplementation(() => chain),
        select: jest.fn().mockImplementation(() => chain),
        where: jest.fn().mockImplementation(() => chain),
        groupBy: jest.fn().mockImplementation(() => chain),
        orderBy: jest.fn().mockImplementation(() => chain),
        crossJoin: jest.fn().mockImplementation(() => chain),
        execute: mockKyselyExecute,
      };
      return chain;
    };

    const kyselyChain = createKyselyChain();
    mockKyselyWith = kyselyChain.with;
    mockKyselySelectFrom = kyselyChain.selectFrom;

    const mockPrismaService = {
      transaction: {
        aggregate: mockTransactionAggregate,
      },
    } as unknown as PrismaService;

    const mockKyselyService = {
      with: mockKyselyWith,
      selectFrom: mockKyselySelectFrom,
    } as unknown as KyselyService;

    module = await createTestModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: KyselyService,
          useValue: mockKyselyService,
        },
      ],
    });

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTransactionBreakdown", () => {
    it("should return transaction breakdown without categories", async () => {
      const params: TransactionBreakdownParamsDto = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        granularity: Granularity.DAY,
        withCategory: false,
      };

      const mockResults = [
        {
          date: new Date("2024-01-01"),
          type: TransactionType.EXPENSE,
          value: "1000",
        },
        {
          date: new Date("2024-01-02"),
          type: TransactionType.INCOME,
          value: "2000",
        },
      ];

      mockKyselyExecute.mockResolvedValue(mockResults);

      const result = await service.getTransactionBreakdown(mockUser, params);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].type).toBe(TransactionType.EXPENSE);
      expect(result.data[0].value).toBe("1000");
      expect(result.data[0].category).toBeUndefined();
    });

    it("should return transaction breakdown with categories", async () => {
      const params: TransactionBreakdownParamsDto = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        granularity: Granularity.DAY,
        withCategory: true,
      };

      const mockResults = [
        {
          date: new Date("2024-01-01"),
          type: TransactionType.EXPENSE,
          value: "1000",
          category: 1,
        },
        {
          date: new Date("2024-01-01"),
          type: TransactionType.EXPENSE,
          value: "500",
          category: 2,
        },
      ];

      mockKyselyExecute.mockResolvedValue(mockResults);

      const result = await service.getTransactionBreakdown(mockUser, params);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].category).toBe(1);
      expect(result.data[1].category).toBe(2);
    });

    it("should handle different granularities", async () => {
      const granularities = [
        Granularity.DAY,
        Granularity.WEEK,
        Granularity.MONTH,
        Granularity.YEAR,
      ];

      for (const granularity of granularities) {
        jest.clearAllMocks();
        const params: TransactionBreakdownParamsDto = {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-12-31"),
          granularity,
        };

        mockKyselyExecute.mockResolvedValue([]);

        await service.getTransactionBreakdown(mockUser, params);

        expect(mockKyselyWith).toHaveBeenCalled();
      }
    });

    it("should handle DAY granularity", async () => {
      const params: TransactionBreakdownParamsDto = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
        granularity: Granularity.DAY,
      };

      mockKyselyExecute.mockResolvedValue([]);

      await service.getTransactionBreakdown(mockUser, params);

      expect(mockKyselyWith).toHaveBeenCalled();
    });

    it("should handle WEEK granularity", async () => {
      const params: TransactionBreakdownParamsDto = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
        granularity: Granularity.WEEK,
      };

      mockKyselyExecute.mockResolvedValue([]);

      await service.getTransactionBreakdown(mockUser, params);

      expect(mockKyselyWith).toHaveBeenCalled();
    });

    it("should handle MONTH granularity", async () => {
      const params: TransactionBreakdownParamsDto = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        granularity: Granularity.MONTH,
      };

      mockKyselyExecute.mockResolvedValue([]);

      await service.getTransactionBreakdown(mockUser, params);

      expect(mockKyselyWith).toHaveBeenCalled();
    });

    it("should handle YEAR granularity", async () => {
      const params: TransactionBreakdownParamsDto = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        granularity: Granularity.YEAR,
      };

      mockKyselyExecute.mockResolvedValue([]);

      await service.getTransactionBreakdown(mockUser, params);

      expect(mockKyselyWith).toHaveBeenCalled();
    });

    it("should handle mixed transaction types in breakdown", async () => {
      const params: TransactionBreakdownParamsDto = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        granularity: Granularity.DAY,
      };

      const mockResults = [
        {
          date: new Date("2024-01-01"),
          type: TransactionType.INCOME,
          value: "3000",
        },
        {
          date: new Date("2024-01-01"),
          type: TransactionType.EXPENSE,
          value: "1000",
        },
      ];

      mockKyselyExecute.mockResolvedValue(mockResults);

      const result = await service.getTransactionBreakdown(mockUser, params);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].type).toBe(TransactionType.INCOME);
      expect(result.data[1].type).toBe(TransactionType.EXPENSE);
    });
  });

  describe("getTransactionBalanceHistory", () => {
    it("should return balance history with cumulative balance", async () => {
      const params: TransactionBalanceHistoryParamsDto = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
        granularity: Granularity.DAY,
      };

      const mockResults = [
        {
          date: new Date("2024-01-01"),
          cumulative_balance: "1000",
        },
        {
          date: new Date("2024-01-02"),
          cumulative_balance: "2500",
        },
      ];

      mockKyselyExecute.mockResolvedValue(mockResults);

      const result = await service.getTransactionBalanceHistory(
        mockUser,
        params,
      );

      expect(result).toHaveLength(2);
      expect(result[0].value).toBe("1000");
      expect(result[1].value).toBe("2500");
    });

    it("should calculate initial balance before start date", async () => {
      const params: TransactionBalanceHistoryParamsDto = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
        granularity: Granularity.DAY,
      };

      mockKyselyExecute.mockResolvedValue([]);

      await service.getTransactionBalanceHistory(mockUser, params);

      expect(mockKyselyWith).toHaveBeenCalled();
    });

    it("should handle empty results", async () => {
      const params: TransactionBalanceHistoryParamsDto = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
        granularity: Granularity.DAY,
      };

      mockKyselyExecute.mockResolvedValue([]);

      const result = await service.getTransactionBalanceHistory(
        mockUser,
        params,
      );

      expect(result).toEqual([]);
    });

    it("should handle DAY granularity", async () => {
      const params: TransactionBalanceHistoryParamsDto = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
        granularity: Granularity.DAY,
      };

      mockKyselyExecute.mockResolvedValue([]);

      await service.getTransactionBalanceHistory(mockUser, params);

      expect(mockKyselyWith).toHaveBeenCalled();
    });

    it("should handle WEEK granularity", async () => {
      const params: TransactionBalanceHistoryParamsDto = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
        granularity: Granularity.WEEK,
      };

      mockKyselyExecute.mockResolvedValue([]);

      await service.getTransactionBalanceHistory(mockUser, params);

      expect(mockKyselyWith).toHaveBeenCalled();
    });

    it("should handle MONTH granularity", async () => {
      const params: TransactionBalanceHistoryParamsDto = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        granularity: Granularity.MONTH,
      };

      mockKyselyExecute.mockResolvedValue([]);

      await service.getTransactionBalanceHistory(mockUser, params);

      expect(mockKyselyWith).toHaveBeenCalled();
    });

    it("should handle YEAR granularity", async () => {
      const params: TransactionBalanceHistoryParamsDto = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        granularity: Granularity.YEAR,
      };

      mockKyselyExecute.mockResolvedValue([]);

      await service.getTransactionBalanceHistory(mockUser, params);

      expect(mockKyselyWith).toHaveBeenCalled();
    });

    it("should handle cumulative balance calculation correctly", async () => {
      const params: TransactionBalanceHistoryParamsDto = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
        granularity: Granularity.DAY,
      };

      const mockResults = [
        {
          date: new Date("2024-01-01"),
          cumulative_balance: "1000",
        },
        {
          date: new Date("2024-01-02"),
          cumulative_balance: "1500",
        },
        {
          date: new Date("2024-01-03"),
          cumulative_balance: "1200",
        },
      ];

      mockKyselyExecute.mockResolvedValue(mockResults);

      const result = await service.getTransactionBalanceHistory(
        mockUser,
        params,
      );

      expect(result).toHaveLength(3);
      expect(result[0].value).toBe("1000");
      expect(result[1].value).toBe("1500");
      expect(result[2].value).toBe("1200");
    });
  });

  describe("getMaxTransactionAmountForUser", () => {
    it("should return maximum transaction amount rounded up", async () => {
      mockTransactionAggregate.mockResolvedValue({
        _max: { amount: 1234 },
      });

      const result = await service.getMaxTransactionAmountForUser(mockUser);

      expect(result).toBe(1300);
      expect(mockTransactionAggregate).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        _max: { amount: true },
      });
    });

    it("should return 0 when no transactions exist", async () => {
      mockTransactionAggregate.mockResolvedValue({
        _max: { amount: null },
      });

      const result = await service.getMaxTransactionAmountForUser(mockUser);

      expect(result).toBe(0);
    });

    it("should round up to nearest 100", async () => {
      mockTransactionAggregate.mockResolvedValue({
        _max: { amount: 1234 },
      });

      const result = await service.getMaxTransactionAmountForUser(mockUser);

      expect(result).toBe(1300);
    });

    it("should handle exact multiples of 100", async () => {
      mockTransactionAggregate.mockResolvedValue({
        _max: { amount: 1000 },
      });

      const result = await service.getMaxTransactionAmountForUser(mockUser);

      expect(result).toBe(1000);
    });
  });
});
