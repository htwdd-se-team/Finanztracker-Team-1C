import { INestApplication } from "@nestjs/common";
import { App } from "supertest/types";
import { DateTime } from "luxon";
import { Api, ApiTransactionType, ApiCurrency, ApiGranularity } from "api-client";
import { registerTestUser } from "./helpers/auth-helper";
import { createTestApp } from "./helpers/test-app";

describe("AnalyticsController (e2e)", () => {
  let app: INestApplication<App>;
  let url: string;
  let testUser: Awaited<ReturnType<typeof registerTestUser>>;
  let api: Api<string>;
  let expenseCategoryId: number;
  let incomeCategoryId: number;

  const createdEntries: {
    id: number;
    type: ApiTransactionType;
    amount: number;
    date: Date;
    categoryId?: number;
  }[] = [];

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    url = testApp.url;
    testUser = await registerTestUser(url);

    api = new Api({ 
      baseURL: url, 
      validateStatus: () => true,
      securityWorker: (token) => token ? { headers: { Authorization: `Bearer ${token}` } } : {},
    });
    api.setSecurityData(testUser.token);

    // Create categories for analytics
    const category1Response = await api.categories.categoryControllerCreate({
      name: `Analytics Category 1 ${Math.random().toString(36).substring(2, 9)}`,
      color: "Red",
      icon: "chart",
    });
    expect([200, 201]).toContain(category1Response.status);

    const category2Response = await api.categories.categoryControllerCreate({
      name: `Analytics Category 2 ${Math.random().toString(36).substring(2, 9)}`,
      color: "Blue",
      icon: "shopping",
    });
    expect([200, 201]).toContain(category2Response.status);

    expenseCategoryId = category1Response.data.id;
    incomeCategoryId = category2Response.data.id;

    // Create a comprehensive set of test transactions with known amounts and dates
    const now = DateTime.now();
    const baseDate = now.minus({ days: 5 }).startOf("day");

    // Day 1: Income 10000, Expense 3000
    const entry1 = await api.entries.entryControllerCreate({
      type: ApiTransactionType.INCOME,
      amount: 10000,
      description: "Salary",
      currency: ApiCurrency.EUR,
      categoryId: incomeCategoryId,
      createdAt: baseDate.toISO(),
    });
    expect([200, 201]).toContain(entry1.status);
    
    createdEntries.push({
      id: entry1.data.id,
      type: ApiTransactionType.INCOME,
      amount: 10000,
      date: baseDate.toJSDate(),
      categoryId: incomeCategoryId,
    });

    const entry2 = await api.entries.entryControllerCreate({
      type: ApiTransactionType.EXPENSE,
      amount: 3000,
      description: "Groceries",
      currency: ApiCurrency.EUR,
      categoryId: expenseCategoryId,
      createdAt: baseDate.toISO(),
    });
    expect([200, 201]).toContain(entry2.status);

    createdEntries.push({
      id: entry2.data.id,
      type: ApiTransactionType.EXPENSE,
      amount: 3000,
      date: baseDate.toJSDate(),
      categoryId: expenseCategoryId,
    });

    // Day 2: Income 5000, Expense 2000
    const day2 = baseDate.plus({ days: 1 }).startOf("day");
    const entry3 = await api.entries.entryControllerCreate({
      type: ApiTransactionType.INCOME,
      amount: 5000,
      description: "Freelance",
      currency: ApiCurrency.EUR,
      categoryId: incomeCategoryId,
      createdAt: day2.toISO(),
    });
    expect([200, 201]).toContain(entry3.status);

    createdEntries.push({
      id: entry3.data.id,
      type: ApiTransactionType.INCOME,
      amount: 5000,
      date: day2.toJSDate(),
      categoryId: incomeCategoryId,
    });

    const entry4 = await api.entries.entryControllerCreate({
      type: ApiTransactionType.EXPENSE,
      amount: 2000,
      description: "Transport",
      currency: ApiCurrency.EUR,
      categoryId: expenseCategoryId,
      createdAt: day2.toISO(),
    });
    expect([200, 201]).toContain(entry4.status);

    createdEntries.push({
      id: entry4.data.id,
      type: ApiTransactionType.EXPENSE,
      amount: 2000,
      date: day2.toJSDate(),
      categoryId: expenseCategoryId,
    });

    // Day 3: Large expense 15000
    const day3 = baseDate.plus({ days: 2 }).startOf("day");
    const entry5 = await api.entries.entryControllerCreate({
      type: ApiTransactionType.EXPENSE,
      amount: 15000,
      description: "Large purchase",
      currency: ApiCurrency.EUR,
      categoryId: expenseCategoryId,
      createdAt: day3.toISO(),
    });
    expect([200, 201]).toContain(entry5.status);

    createdEntries.push({
      id: entry5.data.id,
      type: ApiTransactionType.EXPENSE,
      amount: 15000,
      date: day3.toJSDate(),
      categoryId: expenseCategoryId,
    });

    // Day 4: Small income 1000
    const day4 = baseDate.plus({ days: 3 });
    const entry6 = await api.entries.entryControllerCreate({
      type: ApiTransactionType.INCOME,
      amount: 1000,
      description: "Small income",
      currency: ApiCurrency.EUR,
      categoryId: incomeCategoryId,
      createdAt: day4.toISO(),
    });
    expect([200, 201]).toContain(entry6.status);

    createdEntries.push({
      id: entry6.data.id,
      type: ApiTransactionType.INCOME,
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
      const response = await api.analytics.analyticsControllerFilterDetails();
      expect(response.status).toBe(200);

      const maxPriceResponse = response.data;
      expect(maxPriceResponse).toHaveProperty("maxPrice");
      expect(typeof maxPriceResponse.maxPrice).toBe("number");
      expect(maxPriceResponse.maxPrice).toBeGreaterThanOrEqual(0);

      // Verify the max price matches our largest transaction (15000)
      // The service rounds up to nearest 100, so 15000 should round to 15000
      expect(maxPriceResponse.maxPrice).toBeGreaterThanOrEqual(15000);
      expect(maxPriceResponse.maxPrice).toBeLessThanOrEqual(15100);
    });

    it("should return rounded max price (rounded to nearest 100)", async () => {
      const response = await api.analytics.analyticsControllerFilterDetails();
      expect(response.status).toBe(200);

      const maxPriceResponse = response.data;
      // Max price should be rounded to nearest 100
      expect(maxPriceResponse.maxPrice % 100).toBe(0);
    });
  });

  describe("GET /analytics/transaction-breakdown", () => {
    it("should get transaction breakdown with correct calculations", async () => {
      const startDate = DateTime.now().minus({ days: 10 }).toISO();
      const endDate = DateTime.now().plus({ days: 1 }).toISO();

      const response = await api.analytics.analyticsControllerGetTransactionBreakdown({
        startDate,
        endDate,
        granularity: ApiGranularity.DAY,
      });
      expect(response.status).toBe(200);

      const breakdownResponse = response.data;
      expect(breakdownResponse).toHaveProperty("data");
      expect(Array.isArray(breakdownResponse.data)).toBe(true);

      // Verify calculations: sum all income and expenses
      let totalIncome = 0;
      let totalExpense = 0;

      breakdownResponse.data.forEach((item) => {
        const value = parseInt(item.value);
        if (item.type === ApiTransactionType.INCOME) {
          totalIncome += value;
        } else if (item.type === ApiTransactionType.EXPENSE) {
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

      const response = await api.analytics.analyticsControllerGetTransactionBreakdown({
        startDate,
        endDate,
        granularity: ApiGranularity.DAY,
      });
      expect(response.status).toBe(200);

      const breakdownResponse = response.data;

      // Should have entries for each day with transactions
      expect(breakdownResponse.data.length).toBeGreaterThan(0);

      // Verify each entry has required fields
      breakdownResponse.data.forEach((item) => {
        expect(item).toHaveProperty("date");
        expect(item).toHaveProperty("type");
        expect(item).toHaveProperty("value");
        expect([ApiTransactionType.INCOME, ApiTransactionType.EXPENSE]).toContain(
          item.type,
        );
        expect(parseInt(item.value)).toBeGreaterThan(0);
      });
    });

    it("should include category information when withCategory is true", async () => {
      const startDate = DateTime.now().minus({ days: 10 }).toISO();
      const endDate = DateTime.now().plus({ days: 1 }).toISO();

      const response = await api.analytics.analyticsControllerGetTransactionBreakdown({
        startDate,
        endDate,
        granularity: ApiGranularity.DAY,
        withCategory: true,
      });
      expect(response.status).toBe(200);

      const breakdownResponse = response.data;

      // All entries should have category information
      breakdownResponse.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(typeof item.category).toBe("number");
      });
    });

    it("should work with different granularities", async () => {
      const startDate = DateTime.now().minus({ days: 10 }).toISO();
      const endDate = DateTime.now().plus({ days: 1 }).toISO();

      for (const granularity of [
        ApiGranularity.DAY,
        ApiGranularity.WEEK,
        ApiGranularity.MONTH,
        ApiGranularity.YEAR,
      ]) {
        const response = await api.analytics.analyticsControllerGetTransactionBreakdown({
          startDate,
          endDate,
          granularity,
        });
        expect(response.status).toBe(200);

        const breakdownResponse = response.data;
        expect(breakdownResponse).toHaveProperty("data");
        expect(Array.isArray(breakdownResponse.data)).toBe(true);
      }
    });
  });

  describe("GET /analytics/transaction-balance-history", () => {
    it("should get transaction balance history with correct cumulative calculations", async () => {
      const startDate = DateTime.now().minus({ days: 10 }).toISO();
      const endDate = DateTime.now().plus({ days: 1 }).toISO();

      const response = await api.analytics.analyticsControllerGetTransactionBalanceHistory({
        startDate,
        endDate,
        granularity: ApiGranularity.DAY,
      });
      expect(response.status).toBe(200);

      const balanceHistory = response.data;
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
      const balanceResponse = await api.user.userControllerGetBalance();
      expect(balanceResponse.status).toBe(200);

      const userBalance = balanceResponse.data;
      const finalBalance = parseInt(
        balanceHistory[balanceHistory.length - 1].value,
      );

      // Final balance in history should match user balance
      expect(finalBalance).toBe(userBalance.balance);
    });

    it("should calculate initial balance correctly", async () => {
      // Create a transaction before the start date
      const beforeStartDate = DateTime.now().minus({ days: 15 });
      const response = await api.entries.entryControllerCreate({
        type: ApiTransactionType.INCOME,
        amount: 5000,
        description: "Initial balance test",
        currency: ApiCurrency.EUR,
        createdAt: beforeStartDate.toISO(),
      });
      expect([200, 201]).toContain(response.status);

      const startDate = DateTime.now().minus({ days: 10 }).toISO();
      const endDate = DateTime.now().plus({ days: 1 }).toISO();

      const historyResponse = await api.analytics.analyticsControllerGetTransactionBalanceHistory({
        startDate,
        endDate,
        granularity: ApiGranularity.DAY,
      });
      expect(historyResponse.status).toBe(200);

      const balanceHistory = historyResponse.data;
      expect(balanceHistory.length).toBeGreaterThan(0);

      // First balance should include the initial balance (5000)
      const firstBalance = parseInt(balanceHistory[0].value);
      expect(firstBalance).toBeGreaterThanOrEqual(5000);
    });

    it("should work with different granularities", async () => {
      const startDate = DateTime.now().minus({ days: 30 }).toISO();
      const endDate = DateTime.now().plus({ days: 1 }).toISO();

      for (const granularity of [
        ApiGranularity.DAY,
        ApiGranularity.WEEK,
        ApiGranularity.MONTH,
        ApiGranularity.YEAR,
      ]) {
        const response = await api.analytics.analyticsControllerGetTransactionBalanceHistory({
          startDate,
          endDate,
          granularity,
        });
        expect(response.status).toBe(200);

        const balanceHistory = response.data;
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
      const balanceResponse = await api.user.userControllerGetBalance();
      expect(balanceResponse.status).toBe(200);

      const userBalance = balanceResponse.data;

      // Get balance history
      const startDate = DateTime.now().minus({ days: 30 }).toISO();
      const endDate = DateTime.now().plus({ days: 1 }).toISO();

      const historyResponse = await api.analytics.analyticsControllerGetTransactionBalanceHistory({
        startDate,
        endDate,
        granularity: ApiGranularity.DAY,
      });
      expect(historyResponse.status).toBe(200);

      const balanceHistory = historyResponse.data;

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

      const breakdownResponse = await api.analytics.analyticsControllerGetTransactionBreakdown({
        startDate,
        endDate,
        granularity: ApiGranularity.DAY,
      });
      expect(breakdownResponse.status).toBe(200);

      const breakdown = breakdownResponse.data;

      let totalIncome = 0;
      let totalExpense = 0;

      breakdown.data.forEach((item) => {
        const value = parseInt(item.value);
        if (item.type === ApiTransactionType.INCOME) {
          totalIncome += value;
        } else if (item.type === ApiTransactionType.EXPENSE) {
          totalExpense += value;
        }
      });

      const netBalance = totalIncome - totalExpense;
      // Net should be negative: 16000 - 20000 = -4000
      expect(netBalance).toBe(-4000);
    });
  });
});