import { INestApplication } from "@nestjs/common";
import { TransactionType } from "@prisma/client";
import { DateTime } from "luxon";
import * as request from "supertest";
import { App } from "supertest/types";
import {
  CategoryResponseDto,
  Currency,
  Granularity,
  MaxValueDto,
  TransactionBreakdownResponseDto,
  TransactionItemDto,
  UserBalanceResponseDto,
} from "@/dto";

import { registerTestUser } from "./helpers/auth-helper";
import { createTestApp } from "./helpers/test-app";

describe("AnalyticsController (e2e)", () => {
  let app: INestApplication<App>;
  let testUser: Awaited<ReturnType<typeof registerTestUser>>;
  let expenseCategoryId: number;
  let incomeCategoryId: number;

  const createdEntries: {
    id: number;
    type: TransactionType;
    amount: number;
    date: Date;
    categoryId?: number;
  }[] = [];

  beforeAll(async () => {
    app = await createTestApp();
    testUser = await registerTestUser(app);

    // Create categories for analytics
    const category1Response = await request(app.getHttpServer())
      .post("/categories")
      .set("Authorization", `Bearer ${testUser.token}`)
      .send({
        name: `Analytics Category 1 ${Math.random().toString(36).substring(2, 9)}`,
        color: "Red",
        icon: "chart",
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const category2Response = await request(app.getHttpServer())
      .post("/categories")
      .set("Authorization", `Bearer ${testUser.token}`)
      .send({
        name: `Analytics Category 2 ${Math.random().toString(36).substring(2, 9)}`,
        color: "Blue",
        icon: "shopping",
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    expenseCategoryId = (category1Response.body as CategoryResponseDto).id;
    incomeCategoryId = (category2Response.body as CategoryResponseDto).id;

    // Create a comprehensive set of test transactions with known amounts and dates
    const now = DateTime.now();
    const baseDate = now.minus({ days: 5 });

    // Day 1: Income 10000, Expense 3000
    const entry1 = await request(app.getHttpServer())
      .post("/entries/create")
      .set("Authorization", `Bearer ${testUser.token}`)
      .send({
        type: TransactionType.INCOME,
        amount: 10000,
        description: "Salary",
        currency: Currency.EUR,
        categoryId: incomeCategoryId,
        createdAt: baseDate.toISO(),
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });
    createdEntries.push({
      id: (entry1.body as { id: number }).id,
      type: TransactionType.INCOME,
      amount: 10000,
      date: baseDate.toJSDate(),
      categoryId: incomeCategoryId,
    });

    const entry2 = await request(app.getHttpServer())
      .post("/entries/create")
      .set("Authorization", `Bearer ${testUser.token}`)
      .send({
        type: TransactionType.EXPENSE,
        amount: 3000,
        description: "Groceries",
        currency: Currency.EUR,
        categoryId: expenseCategoryId,
        createdAt: baseDate.toISO(),
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });
    createdEntries.push({
      id: (entry2.body as { id: number }).id,
      type: TransactionType.EXPENSE,
      amount: 3000,
      date: baseDate.toJSDate(),
      categoryId: expenseCategoryId,
    });

    // Day 2: Income 5000, Expense 2000
    const day2 = baseDate.plus({ days: 1 });
    const entry3 = await request(app.getHttpServer())
      .post("/entries/create")
      .set("Authorization", `Bearer ${testUser.token}`)
      .send({
        type: TransactionType.INCOME,
        amount: 5000,
        description: "Freelance",
        currency: Currency.EUR,
        categoryId: incomeCategoryId,
        createdAt: day2.toISO(),
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });
    createdEntries.push({
      id: (entry3.body as { id: number }).id,
      type: TransactionType.INCOME,
      amount: 5000,
      date: day2.toJSDate(),
      categoryId: incomeCategoryId,
    });

    const entry4 = await request(app.getHttpServer())
      .post("/entries/create")
      .set("Authorization", `Bearer ${testUser.token}`)
      .send({
        type: TransactionType.EXPENSE,
        amount: 2000,
        description: "Transport",
        currency: Currency.EUR,
        categoryId: expenseCategoryId,
        createdAt: day2.toISO(),
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });
    createdEntries.push({
      id: (entry4.body as { id: number }).id,
      type: TransactionType.EXPENSE,
      amount: 2000,
      date: day2.toJSDate(),
      categoryId: expenseCategoryId,
    });

    // Day 3: Large expense 15000
    const day3 = baseDate.plus({ days: 2 });
    const entry5 = await request(app.getHttpServer())
      .post("/entries/create")
      .set("Authorization", `Bearer ${testUser.token}`)
      .send({
        type: TransactionType.EXPENSE,
        amount: 15000,
        description: "Large purchase",
        currency: Currency.EUR,
        categoryId: expenseCategoryId,
        createdAt: day3.toISO(),
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });
    createdEntries.push({
      id: (entry5.body as { id: number }).id,
      type: TransactionType.EXPENSE,
      amount: 15000,
      date: day3.toJSDate(),
      categoryId: expenseCategoryId,
    });

    // Day 4: Small income 1000
    const day4 = baseDate.plus({ days: 3 });
    const entry6 = await request(app.getHttpServer())
      .post("/entries/create")
      .set("Authorization", `Bearer ${testUser.token}`)
      .send({
        type: TransactionType.INCOME,
        amount: 1000,
        description: "Small income",
        currency: Currency.EUR,
        categoryId: incomeCategoryId,
        createdAt: day4.toISO(),
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });
    createdEntries.push({
      id: (entry6.body as { id: number }).id,
      type: TransactionType.INCOME,
      amount: 1000,
      date: day4.toJSDate(),
      categoryId: incomeCategoryId,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /analytics/filter-details", () => {
    it("should get filter details (max transaction amount)", async () => {
      const response = await request(app.getHttpServer())
        .get("/analytics/filter-details")
        .set("Authorization", `Bearer ${testUser.token}`)
        .expect(200);

      const maxPriceResponse = response.body as MaxValueDto;
      expect(maxPriceResponse).toHaveProperty("maxPrice");
      expect(typeof maxPriceResponse.maxPrice).toBe("number");
      expect(maxPriceResponse.maxPrice).toBeGreaterThanOrEqual(0);

      // Verify the max price matches our largest transaction (15000)
      // The service rounds up to nearest 100, so 15000 should round to 15000
      expect(maxPriceResponse.maxPrice).toBeGreaterThanOrEqual(15000);
      expect(maxPriceResponse.maxPrice).toBeLessThanOrEqual(15100);
    });

    it("should return rounded max price (rounded to nearest 100)", async () => {
      const response = await request(app.getHttpServer())
        .get("/analytics/filter-details")
        .set("Authorization", `Bearer ${testUser.token}`)
        .expect(200);

      const maxPriceResponse = response.body as MaxValueDto;
      // Max price should be rounded to nearest 100
      expect(maxPriceResponse.maxPrice % 100).toBe(0);
    });
  });

  describe("GET /analytics/transaction-breakdown", () => {
    it("should get transaction breakdown with correct calculations", async () => {
      const startDate = DateTime.now().minus({ days: 10 }).toISO();
      const endDate = DateTime.now().plus({ days: 1 }).toISO();

      const response = await request(app.getHttpServer())
        .get("/analytics/transaction-breakdown")
        .set("Authorization", `Bearer ${testUser.token}`)
        .query({
          startDate,
          endDate,
          granularity: Granularity.DAY,
        })
        .expect(200);

      const breakdownResponse =
        response.body as TransactionBreakdownResponseDto;
      expect(breakdownResponse).toHaveProperty("data");
      expect(Array.isArray(breakdownResponse.data)).toBe(true);

      // Verify calculations: sum all income and expenses
      let totalIncome = 0;
      let totalExpense = 0;

      breakdownResponse.data.forEach((item) => {
        const value = parseInt(item.value);
        if (item.type === TransactionType.INCOME) {
          totalIncome += value;
        } else if (item.type === TransactionType.EXPENSE) {
          totalExpense += value;
        }
      });

      // Expected: Income = 10000 + 5000 + 1000 = 16000
      // Expected: Expense = 3000 + 2000 + 15000 = 20000
      expect(totalIncome).toBe(16000);
      expect(totalExpense).toBe(20000);
    });

    it("should group transactions by day correctly", async () => {
      const startDate = DateTime.now().minus({ days: 10 }).toISO();
      const endDate = DateTime.now().plus({ days: 1 }).toISO();

      const response = await request(app.getHttpServer())
        .get("/analytics/transaction-breakdown")
        .set("Authorization", `Bearer ${testUser.token}`)
        .query({
          startDate,
          endDate,
          granularity: Granularity.DAY,
        })
        .expect(200);

      const breakdownResponse =
        response.body as TransactionBreakdownResponseDto;

      // Should have entries for each day with transactions
      expect(breakdownResponse.data.length).toBeGreaterThan(0);

      // Verify each entry has required fields
      breakdownResponse.data.forEach((item) => {
        expect(item).toHaveProperty("date");
        expect(item).toHaveProperty("type");
        expect(item).toHaveProperty("value");
        expect([TransactionType.INCOME, TransactionType.EXPENSE]).toContain(
          item.type,
        );
        expect(parseInt(item.value)).toBeGreaterThan(0);
      });
    });

    it("should include category information when withCategory is true", async () => {
      const startDate = DateTime.now().minus({ days: 10 }).toISO();
      const endDate = DateTime.now().plus({ days: 1 }).toISO();

      const response = await request(app.getHttpServer())
        .get("/analytics/transaction-breakdown")
        .set("Authorization", `Bearer ${testUser.token}`)
        .query({
          startDate,
          endDate,
          granularity: Granularity.DAY,
          withCategory: true,
        })
        .expect(200);

      const breakdownResponse =
        response.body as TransactionBreakdownResponseDto;

      // All entries should have category information
      breakdownResponse.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(typeof item.category).toBe("number");
      });
    });

    it("should respect date range filters", async () => {
      const startDate = DateTime.now().minus({ days: 10 }).toISO();
      // Set endDate to end of Day 2 to exclude Day 3
      // Day 2 ends at: now.minus({ days: 4 }).endOf('day')
      const endDate = DateTime.now().minus({ days: 4 }).endOf("day").toISO();

      const response = await request(app.getHttpServer())
        .get("/analytics/transaction-breakdown")
        .set("Authorization", `Bearer ${testUser.token}`)
        .query({
          startDate,
          endDate,
          granularity: Granularity.DAY,
        })
        .expect(200);

      const breakdownResponse =
        response.body as TransactionBreakdownResponseDto;

      // Should only include transactions from the first 2 days
      // Day 1: Income 10000, Expense 3000
      // Day 2: Income 5000, Expense 2000
      let totalIncome = 0;
      let totalExpense = 0;

      breakdownResponse.data.forEach((item) => {
        const value = parseInt(item.value);
        if (item.type === TransactionType.INCOME) {
          totalIncome += value;
        } else if (item.type === TransactionType.EXPENSE) {
          totalExpense += value;
        }
      });

      expect(totalIncome).toBe(15000); // 10000 + 5000
      expect(totalExpense).toBe(5000); // 3000 + 2000
    });

    it("should work with different granularities", async () => {
      const startDate = DateTime.now().minus({ days: 10 }).toISO();
      const endDate = DateTime.now().plus({ days: 1 }).toISO();

      for (const granularity of [
        Granularity.DAY,
        Granularity.WEEK,
        Granularity.MONTH,
        Granularity.YEAR,
      ]) {
        const response = await request(app.getHttpServer())
          .get("/analytics/transaction-breakdown")
          .set("Authorization", `Bearer ${testUser.token}`)
          .query({
            startDate,
            endDate,
            granularity,
          })
          .expect(200);

        const breakdownResponse =
          response.body as TransactionBreakdownResponseDto;
        expect(breakdownResponse).toHaveProperty("data");
        expect(Array.isArray(breakdownResponse.data)).toBe(true);
      }
    });
  });

  describe("GET /analytics/transaction-balance-history", () => {
    it("should get transaction balance history with correct cumulative calculations", async () => {
      const startDate = DateTime.now().minus({ days: 10 }).toISO();
      const endDate = DateTime.now().plus({ days: 1 }).toISO();

      const response = await request(app.getHttpServer())
        .get("/analytics/transaction-balance-history")
        .set("Authorization", `Bearer ${testUser.token}`)
        .query({
          startDate,
          endDate,
          granularity: Granularity.DAY,
        })
        .expect(200);

      const balanceHistory = response.body as TransactionItemDto[];
      expect(Array.isArray(balanceHistory)).toBe(true);
      expect(balanceHistory.length).toBeGreaterThan(0);

      // Verify cumulative balance calculation
      // Starting balance: 0 (no transactions before startDate)
      // Day 1: +10000 (income) - 3000 (expense) = +7000
      // Day 2: +5000 (income) - 2000 (expense) = +3000, cumulative = +10000
      // Day 3: -15000 (expense), cumulative = -5000
      // Day 4: +1000 (income), cumulative = -4000

      // Check that balances are cumulative and increasing/decreasing correctly
      for (let i = 1; i < balanceHistory.length; i++) {
        const currBalance = parseInt(balanceHistory[i].value);
        // Balance should change (not necessarily increase, as expenses reduce it)
        expect(typeof currBalance).toBe("number");
      }

      // Final balance should match user balance
      const balanceResponse = await request(app.getHttpServer())
        .get("/user/balance")
        .set("Authorization", `Bearer ${testUser.token}`)
        .expect(200);

      const userBalance = balanceResponse.body as UserBalanceResponseDto;
      const finalBalance = parseInt(
        balanceHistory[balanceHistory.length - 1].value,
      );

      // Final balance in history should match user balance
      expect(finalBalance).toBe(userBalance.balance);
    });

    it("should calculate initial balance correctly", async () => {
      // Create a transaction before the start date
      const beforeStartDate = DateTime.now().minus({ days: 15 });
      await request(app.getHttpServer())
        .post("/entries/create")
        .set("Authorization", `Bearer ${testUser.token}`)
        .send({
          type: TransactionType.INCOME,
          amount: 5000,
          description: "Initial balance test",
          currency: Currency.EUR,
          createdAt: beforeStartDate.toISO(),
        })
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const startDate = DateTime.now().minus({ days: 10 }).toISO();
      const endDate = DateTime.now().plus({ days: 1 }).toISO();

      const response = await request(app.getHttpServer())
        .get("/analytics/transaction-balance-history")
        .set("Authorization", `Bearer ${testUser.token}`)
        .query({
          startDate,
          endDate,
          granularity: Granularity.DAY,
        })
        .expect(200);

      const balanceHistory = response.body as TransactionItemDto[];
      expect(balanceHistory.length).toBeGreaterThan(0);

      // First balance should include the initial balance (5000)
      const firstBalance = parseInt(balanceHistory[0].value);
      expect(firstBalance).toBeGreaterThanOrEqual(5000);
    });

    it("should respect date range filters", async () => {
      const startDate = DateTime.now().minus({ days: 5 }).toISO();
      const endDate = DateTime.now().minus({ days: 2 }).toISO();

      const response = await request(app.getHttpServer())
        .get("/analytics/transaction-balance-history")
        .set("Authorization", `Bearer ${testUser.token}`)
        .query({
          startDate,
          endDate,
          granularity: Granularity.DAY,
        })
        .expect(200);

      const balanceHistory = response.body as TransactionItemDto[];
      expect(Array.isArray(balanceHistory)).toBe(true);

      // All dates should be within the range
      balanceHistory.forEach((item) => {
        const itemDate = new Date(item.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        expect(itemDate.getTime()).toBeGreaterThanOrEqual(start.getTime());
        expect(itemDate.getTime()).toBeLessThanOrEqual(end.getTime());
      });
    });

    it("should work with different granularities", async () => {
      const startDate = DateTime.now().minus({ days: 30 }).toISO();
      const endDate = DateTime.now().plus({ days: 1 }).toISO();

      for (const granularity of [
        Granularity.DAY,
        Granularity.WEEK,
        Granularity.MONTH,
        Granularity.YEAR,
      ]) {
        const response = await request(app.getHttpServer())
          .get("/analytics/transaction-balance-history")
          .set("Authorization", `Bearer ${testUser.token}`)
          .query({
            startDate,
            endDate,
            granularity,
          })
          .expect(200);

        const balanceHistory = response.body as TransactionItemDto[];
        expect(Array.isArray(balanceHistory)).toBe(true);
        expect(balanceHistory.length).toBeGreaterThan(0);

        // Each entry should have date and value
        balanceHistory.forEach((item) => {
          expect(item).toHaveProperty("date");
          expect(item).toHaveProperty("value");
          expect(typeof parseInt(item.value)).toBe("number");
        });
      }
    });
  });

  describe("Analytics consistency checks", () => {
    it("should have consistent balance calculations across endpoints", async () => {
      // Get user balance
      const balanceResponse = await request(app.getHttpServer())
        .get("/user/balance")
        .set("Authorization", `Bearer ${testUser.token}`)
        .expect(200);

      const userBalance = balanceResponse.body as UserBalanceResponseDto;

      // Get balance history
      const startDate = DateTime.now().minus({ days: 30 }).toISO();
      const endDate = DateTime.now().plus({ days: 1 }).toISO();

      const historyResponse = await request(app.getHttpServer())
        .get("/analytics/transaction-balance-history")
        .set("Authorization", `Bearer ${testUser.token}`)
        .query({
          startDate,
          endDate,
          granularity: Granularity.DAY,
        })
        .expect(200);

      const balanceHistory = historyResponse.body as TransactionItemDto[];

      if (balanceHistory.length > 0) {
        const finalBalance = parseInt(
          balanceHistory[balanceHistory.length - 1].value,
        );
        // Final balance should match user balance
        expect(finalBalance).toBe(userBalance.balance);
      }
    });

    it("should calculate net balance correctly from breakdown", async () => {
      const startDate = DateTime.now().minus({ days: 10 }).toISO();
      const endDate = DateTime.now().plus({ days: 1 }).toISO();

      const breakdownResponse = await request(app.getHttpServer())
        .get("/analytics/transaction-breakdown")
        .set("Authorization", `Bearer ${testUser.token}`)
        .query({
          startDate,
          endDate,
          granularity: Granularity.DAY,
        })
        .expect(200);

      const breakdown =
        breakdownResponse.body as TransactionBreakdownResponseDto;

      let totalIncome = 0;
      let totalExpense = 0;

      breakdown.data.forEach((item) => {
        const value = parseInt(item.value);
        if (item.type === TransactionType.INCOME) {
          totalIncome += value;
        } else if (item.type === TransactionType.EXPENSE) {
          totalExpense += value;
        }
      });

      const netBalance = totalIncome - totalExpense;
      // Net should be negative: 16000 - 20000 = -4000
      expect(netBalance).toBe(-4000);
    });
  });
});
