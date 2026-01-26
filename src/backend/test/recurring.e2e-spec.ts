import { INestApplication } from "@nestjs/common";
import { App } from "supertest/types";
import { Api, ApiTransactionType, ApiCurrency, ApiRecurringTransactionType } from "api-client";
import { registerTestUser } from "./helpers/auth-helper";
import { createTestApp } from "./helpers/test-app";

describe("RecurringEntries (e2e)", () => {
  let app: INestApplication<App>;
  let url: string;
  let testUser: Awaited<ReturnType<typeof registerTestUser>>;
  let api: Api<string>;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Recurring Entry Management", () => {
    it("should create, disable and enable a recurring entry", async () => {
      // 1. Create
      const createResponse = await api.entries.entryControllerCreate({
        type: ApiTransactionType.EXPENSE,
        amount: 5000,
        currency: ApiCurrency.EUR,
        description: "Monthly Netflix",
        isRecurring: true,
        recurringType: ApiRecurringTransactionType.MONTHLY,
        recurringBaseInterval: 1
      });
      expect(createResponse.status).toBe(201);
      
      // The parentId is in `transactionId`.
      const entry = createResponse.data;
      const parentId = entry.transactionId ?? entry.id;
      expect(parentId).toBeDefined();

      // 2. Disable
      const disableResponse = await api.entries.entryControllerDisableScheduledEntry(parentId);
      expect(disableResponse.status).toBe(200);

      // Verify disabled in list
      const listDisabled = await api.entries.entryControllerGetScheduledEntries({
        take: 30,
        disabled: true
      });
      expect(listDisabled.data.entries.some(e => e.id === parentId)).toBe(true);

      // 3. Enable
      const enableResponse = await api.entries.entryControllerEnableScheduledEntry(parentId);
      expect(enableResponse.status).toBe(200);

      // Verify active in list
      const listActive = await api.entries.entryControllerGetScheduledEntries({
        take: 30
      });
      expect(listActive.data.entries.some(e => e.id === parentId)).toBe(true);
    });

    it("should get scheduled entries summary", async () => {
      // Create some recurring entries in the future
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      
      await api.entries.entryControllerCreate({
        type: ApiTransactionType.INCOME,
        amount: 200000,
        currency: ApiCurrency.EUR,
        description: "Future Salary",
        isRecurring: true,
        recurringType: ApiRecurringTransactionType.MONTHLY,
        recurringBaseInterval: 1,
        createdAt: nextYear.toISOString()
      });

      const response = await api.entries.entryControllerGetScheduledEntriesSummary();
      expect(response.status).toBe(200);
      expect(response.data.totalCount).toBeGreaterThan(0);
    });

    it("should handle parent entry update (date change)", async () => {
      const initialDate = new Date();
      initialDate.setDate(initialDate.getDate() - 20); // 20 days ago, within 30 days limit

      // Create recurring entry in the past
      const createResponse = await api.entries.entryControllerCreate({
        type: ApiTransactionType.EXPENSE,
        amount: 1000,
        currency: ApiCurrency.EUR,
        description: "Old Date Entry",
        isRecurring: true,
        recurringType: ApiRecurringTransactionType.MONTHLY,
        recurringBaseInterval: 1,
        createdAt: initialDate.toISOString()
      });
      
      const entry = createResponse.data;
      const parentId = entry.transactionId ?? entry.id;

      // Update the date to a different day
      const newDate = new Date(initialDate);
      newDate.setDate(newDate.getDate() + 5);

      const updateResponse = await api.entries.entryControllerUpdate(parentId, {
        createdAt: newDate.toISOString()
      });

      expect(updateResponse.status).toBe(200);
      // The update logic in backend should have handled child creation/deletion
      // We verify the update succeeded.
      expect(updateResponse.data.createdAt).toBe(newDate.toISOString());
    });

    it("should get scheduled monthly totals", async () => {
      const response = await api.entries.entryControllerGetScheduledMonthlyTotals({
        year: new Date().getFullYear()
      });
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.totals)).toBe(true);
      expect(response.data.totals.length).toBe(12);
    });
  });
});
