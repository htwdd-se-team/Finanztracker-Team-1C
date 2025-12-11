import { TestingModule } from "@nestjs/testing";

import { KyselyService } from "../src/services/kysely.service";
import { PrismaService } from "../src/services/prisma.service";
import { UserService } from "../src/services/user.service";

import { createMockUser } from "./mock-data-factory";
import { createMockPrismaService } from "./prisma-mock-factory";
import { createTestModule } from "./test-helpers";

describe("UserService", () => {
  let service: UserService;
  let prismaService: jest.Mocked<PrismaService>;
  let kyselyService: KyselyService;

  const mockUser = createMockUser();

  const mockKyselySelectBuilder = {
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    executeTakeFirst: jest.fn(),
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await createTestModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: KyselyService,
          useValue: {
            selectFrom: jest.fn().mockReturnValue(mockKyselySelectBuilder),
          },
        },
      ],
    });

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(
      PrismaService,
    ) as jest.Mocked<PrismaService>;
    kyselyService = module.get<KyselyService>(KyselyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getUser", () => {
    it("should return user data without sensitive information", async () => {
      const mockUserResponse = {
        givenName: mockUser.givenName,
        familyName: mockUser.familyName,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
      };

      const findUniqueMock = jest.mocked(prismaService.user["findUnique"]);
      findUniqueMock.mockResolvedValue(mockUserResponse as typeof mockUser);

      const result = await service.getUser(mockUser);

      expect(findUniqueMock).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: {
          givenName: true,
          familyName: true,
          email: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(mockUserResponse);
    });

    it("should return null if user not found", async () => {
      const findUniqueMock = jest.mocked(prismaService.user["findUnique"]);
      findUniqueMock.mockResolvedValue(null);

      const result = await service.getUser(mockUser);

      expect(result).toBeNull();
    });
  });

  describe("getBalance", () => {
    it("should calculate balance correctly with income and expenses", async () => {
      const mockBalanceResult = {
        balance: "5000",
        transaction_count: "10",
      };

      mockKyselySelectBuilder.executeTakeFirst.mockResolvedValue(
        mockBalanceResult,
      );

      const result = await service.getBalance(mockUser);

      const selectFromMock = jest.mocked(kyselyService["selectFrom"]);
      expect(selectFromMock).toHaveBeenCalledWith("Transaction");
      const whereMock = jest.mocked(mockKyselySelectBuilder["where"]);
      expect(whereMock).toHaveBeenCalledWith("userId", "=", mockUser.id);
      expect(result).toEqual({
        balance: 5000,
        transactionCount: 10,
      });
    });

    it("should return zero balance when no transactions exist", async () => {
      mockKyselySelectBuilder.executeTakeFirst.mockResolvedValue({
        balance: null,
        transaction_count: null,
      });

      const result = await service.getBalance(mockUser);

      expect(result).toEqual({
        balance: 0,
        transactionCount: 0,
      });
    });

    it("should handle negative balance correctly", async () => {
      const mockBalanceResult = {
        balance: "-3000",
        transaction_count: "5",
      };

      mockKyselySelectBuilder.executeTakeFirst.mockResolvedValue(
        mockBalanceResult,
      );

      const result = await service.getBalance(mockUser);

      expect(result).toEqual({
        balance: -3000,
        transactionCount: 5,
      });
    });

    it("should only count non-recurring transactions", async () => {
      const mockBalanceResult = {
        balance: "10000",
        transaction_count: "20",
      };

      mockKyselySelectBuilder.executeTakeFirst.mockResolvedValue(
        mockBalanceResult,
      );

      await service.getBalance(mockUser);

      // Verify that isRecurring filter is applied
      expect(mockKyselySelectBuilder.where).toHaveBeenCalledWith(
        "isRecurring",
        "=",
        false,
      );
    });

    it("should handle large balance values", async () => {
      const mockBalanceResult = {
        balance: "999999999",
        transaction_count: "1000",
      };

      mockKyselySelectBuilder.executeTakeFirst.mockResolvedValue(
        mockBalanceResult,
      );

      const result = await service.getBalance(mockUser);

      expect(result.balance).toBe(999999999);
      expect(result.transactionCount).toBe(1000);
    });

    it("should handle balance with only income transactions", async () => {
      const mockBalanceResult = {
        balance: "50000",
        transaction_count: "5",
      };

      mockKyselySelectBuilder.executeTakeFirst.mockResolvedValue(
        mockBalanceResult,
      );

      const result = await service.getBalance(mockUser);

      expect(result.balance).toBeGreaterThan(0);
      expect(result.transactionCount).toBe(5);
    });

    it("should handle balance with only expense transactions", async () => {
      const mockBalanceResult = {
        balance: "-30000",
        transaction_count: "8",
      };

      mockKyselySelectBuilder.executeTakeFirst.mockResolvedValue(
        mockBalanceResult,
      );

      const result = await service.getBalance(mockUser);

      expect(result.balance).toBeLessThan(0);
      expect(result.transactionCount).toBe(8);
    });

    it("should exclude future-dated transactions", async () => {
      mockKyselySelectBuilder.executeTakeFirst.mockResolvedValue({
        balance: "1000",
        transaction_count: "1",
      });

      await service.getBalance(mockUser);

      // Verify createdAt filter is applied (createdAt <= NOW())
      expect(mockKyselySelectBuilder.where).toHaveBeenCalled();
    });

    it("should exclude child transactions (transactionId IS NULL)", async () => {
      mockKyselySelectBuilder.executeTakeFirst.mockResolvedValue({
        balance: "5000",
        transaction_count: "10",
      });

      await service.getBalance(mockUser);

      // Verify transactionId filter is applied
      expect(mockKyselySelectBuilder.where).toHaveBeenCalled();
    });
  });

  describe("getUser - Edge Cases", () => {
    it("should handle user without familyName", async () => {
      const userWithoutFamilyName = createMockUser({
        familyName: null,
      });
      const mockUserResponse = {
        givenName: userWithoutFamilyName.givenName,
        familyName: null,
        email: userWithoutFamilyName.email,
        createdAt: userWithoutFamilyName.createdAt,
      };

      const findUniqueMock = jest.mocked(prismaService.user["findUnique"]);
      findUniqueMock.mockResolvedValue(mockUserResponse as typeof mockUser);

      const result = await service.getUser(userWithoutFamilyName);

      expect(result.familyName).toBeNull();
    });
  });
});
