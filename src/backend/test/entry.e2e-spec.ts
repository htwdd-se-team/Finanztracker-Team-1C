import { INestApplication } from "@nestjs/common";
import { Api, ApiTransactionType, ApiCurrency } from "api-client";
import { App } from "supertest/types";

import { registerTestUser } from "./helpers/auth-helper";
import { createTestApp } from "./helpers/test-app";

describe("EntryController (e2e)", () => {
  let app: INestApplication<App>;
  let url: string;
  let testUser: Awaited<ReturnType<typeof registerTestUser>>;
  let api: Api<string>;
  let categoryId: number;
  let entryId: number;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    url = testApp.url;
    testUser = await registerTestUser(url);

    api = new Api({
      baseURL: url,
      validateStatus: () => true,
      securityWorker: (token) =>
        token ? { headers: { Authorization: `Bearer ${token}` } } : {},
    });
    api.setSecurityData(testUser.token);

    // Create a category for entries
    const categoryResponse = await api.categories.categoryControllerCreate({
      name: `Test Category ${Math.random().toString(36).substring(2, 9)}`,
      color: "Blue",
      icon: "shopping-cart",
    });
    expect([200, 201]).toContain(categoryResponse.status);

    categoryId = categoryResponse.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /entries/create", () => {
    it("should create an expense entry", async () => {
      const entryDto = {
        type: ApiTransactionType.EXPENSE,
        amount: 1999, // 19.99 EUR in cents
        description: "Test grocery purchase",
        currency: ApiCurrency.EUR,
        categoryId: categoryId,
      };

      const response = await api.entries.entryControllerCreate(entryDto);
      expect([200, 201]).toContain(response.status);

      const entryResponse = response.data;
      expect(entryResponse).toHaveProperty("id");
      expect(entryResponse.type).toBe(ApiTransactionType.EXPENSE);
      expect(entryResponse.amount).toBe(entryDto.amount);
      expect(entryResponse.description).toBe(entryDto.description);
      expect(entryResponse.currency).toBe(ApiCurrency.EUR);
      expect(entryResponse.categoryId).toBe(categoryId);

      entryId = entryResponse.id;
    });

    it("should create an income entry", async () => {
      const entryDto = {
        type: ApiTransactionType.INCOME,
        amount: 50000, // 500.00 EUR in cents
        description: "Test salary payment",
        currency: ApiCurrency.EUR,
      };

      const response = await api.entries.entryControllerCreate(entryDto);
      expect([200, 201]).toContain(response.status);

      const entryResponse = response.data;
      expect(entryResponse).toHaveProperty("id");
      expect(entryResponse.type).toBe(ApiTransactionType.INCOME);
      expect(entryResponse.amount).toBe(entryDto.amount);
    });
  });

  describe("GET /entries/list", () => {
    it("should list entries", async () => {
      const response = await api.entries.entryControllerList({ take: 10 });
      expect([200, 201]).toContain(response.status);

      const listResponse = response.data;
      expect(listResponse).toHaveProperty("entries");
      expect(Array.isArray(listResponse.entries)).toBe(true);
      expect(listResponse.entries.length).toBeGreaterThan(0);
      expect(listResponse.entries[0]).toHaveProperty("id");
      expect(listResponse.entries[0]).toHaveProperty("type");
      expect(listResponse.entries[0]).toHaveProperty("amount");
    });

    it("should filter entries by type", async () => {
      const response = await api.entries.entryControllerList({
        take: 10,
        transactionType: ApiTransactionType.EXPENSE,
      });
      expect([200, 201]).toContain(response.status);

      const filterResponse = response.data;
      expect(filterResponse).toHaveProperty("entries");
      expect(Array.isArray(filterResponse.entries)).toBe(true);
      // All entries should be expenses
      expect(
        filterResponse.entries.every(
          (entry) => entry.type === ApiTransactionType.EXPENSE,
        ),
      ).toBe(true);
    });

    it("should filter entries by category", async () => {
      const response = await api.entries.entryControllerList({
        take: 10,
        // @ts-expect-error - API expects array but string works too
        categoryIds: categoryId.toString(),
      });
      expect(response.status).toBe(200);
      expect(
        response.data.entries.every((e) => e.categoryId === categoryId),
      ).toBe(true);
    });

    it("should search entries by title", async () => {
      const uniqueDescription = `Unique search term ${Math.random()}`;
      await api.entries.entryControllerCreate({
        type: ApiTransactionType.INCOME,
        amount: 100,
        currency: ApiCurrency.EUR,
        description: uniqueDescription,
      });

      const response = await api.entries.entryControllerList({
        take: 10,
        title: uniqueDescription,
      });
      expect(response.status).toBe(200);
      expect(response.data.entries.length).toBe(1);
      expect(response.data.entries[0].description).toBe(uniqueDescription);
    });

    it("should handle pagination with cursor", async () => {
      // Create multiple entries to test pagination
      for (let i = 0; i < 5; i++) {
        await api.entries.entryControllerCreate({
          type: ApiTransactionType.EXPENSE,
          amount: 100 + i,
          currency: ApiCurrency.EUR,
          description: `Pagination test ${i}`,
        });
      }

      const firstPage = await api.entries.entryControllerList({ take: 2 });
      expect(firstPage.data.entries.length).toBe(2);
      expect(firstPage.data.cursorId).toBeDefined();

      const secondPage = await api.entries.entryControllerList({
        take: 2,
        cursorId: firstPage.data.cursorId,
      });
      expect(secondPage.data.entries.length).toBe(2);
      expect(secondPage.data.entries[0].id).not.toBe(
        firstPage.data.entries[0].id,
      );
    });

    it("should filter by date range", async () => {
      const oldDate = "2020-01-01T10:00:00.000Z";
      await api.entries.entryControllerCreate({
        type: ApiTransactionType.EXPENSE,
        amount: 500,
        currency: ApiCurrency.EUR,
        createdAt: oldDate,
        description: "Old entry",
      });

      const response = await api.entries.entryControllerList({
        take: 10,
        dateFrom: "2019-01-01",
        dateTo: "2021-01-01",
      });

      expect(response.status).toBe(200);
      expect(response.data.entries.length).toBeGreaterThan(0);
      expect(
        response.data.entries.every((e) => {
          const d = new Date(e.createdAt);
          return d >= new Date("2019-01-01") && d <= new Date("2021-01-01");
        }),
      ).toBe(true);
    });
  });

  describe("PATCH /entries/:id", () => {
    it("should update an entry", async () => {
      const updateDto = {
        amount: 2499, // Updated amount
        description: "Updated description",
      };

      const response = await api.entries.entryControllerUpdate(
        entryId,
        updateDto,
      );
      expect([200, 201]).toContain(response.status);

      const updateResponse = response.data;
      expect(updateResponse.id).toBe(entryId);
      expect(updateResponse.amount).toBe(updateDto.amount);
      expect(updateResponse.description).toBe(updateDto.description);
    });
  });

  describe("DELETE /entries/:id", () => {
    it("should delete an entry", async () => {
      // Create a new entry to delete
      const entryDto = {
        type: ApiTransactionType.EXPENSE,
        amount: 1000,
        description: "Entry to be deleted",
        currency: ApiCurrency.EUR,
      };

      const createResponse = await api.entries.entryControllerCreate(entryDto);
      expect([200, 201]).toContain(createResponse.status);

      const deleteEntryId = createResponse.data.id;

      // Delete the entry
      const deleteResponse =
        await api.entries.entryControllerDelete(deleteEntryId);
      expect([200, 201]).toContain(deleteResponse.status);

      // Verify entry is deleted
      const updateResponse = await api.entries.entryControllerUpdate(
        deleteEntryId,
        { amount: 2000 },
      );
      expect(updateResponse.status).toBe(404);
    });
  });

  describe("Scheduled Entries", () => {
    it("should list scheduled entries", async () => {
      const response = await api.entries.entryControllerGetScheduledEntries({
        take: 10,
      });
      expect([200, 201]).toContain(response.status);

      const scheduledEntriesResponse = response.data;

      expect(scheduledEntriesResponse).toHaveProperty("entries");
      expect(scheduledEntriesResponse).toHaveProperty("count");
      expect(Array.isArray(scheduledEntriesResponse.entries)).toBe(true);
    });
  });
});
