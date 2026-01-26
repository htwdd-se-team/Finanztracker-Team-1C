import { INestApplication } from "@nestjs/common";
import { App } from "supertest/types";
import { DateTime } from "luxon";
import { Api, ApiTransactionType, ApiCurrency } from "api-client";
import { registerTestUser } from "./helpers/auth-helper";
import { createTestApp } from "./helpers/test-app";

describe("FilterController (e2e)", () => {
  let app: INestApplication<App>;
  let url: string;
  let testUser: Awaited<ReturnType<typeof registerTestUser>>;
  let api: Api<string>;
  let categoryId: number;
  let filterId: number;

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

    // Create a category for filter tests
    const categoryResponse = await api.categories.categoryControllerCreate({
      name: `Filter Category ${Math.random().toString(36).substring(2, 9)}`,
      color: "Purple",
      icon: "filter",
    });
    expect([200, 201]).toContain(categoryResponse.status);

    categoryId = categoryResponse.data.id;

    // Create some entries for filtering
    await api.entries.entryControllerCreate({
      type: ApiTransactionType.EXPENSE,
      amount: 3000,
      description: "Filter test entry",
      currency: ApiCurrency.EUR,
      categoryId: categoryId,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /filters/create", () => {
    it("should create a filter", async () => {
      const filterDto = {
        title: `Test Filter ${Math.random().toString(36).substring(2, 9)}`,
        icon: "filter",
        minPrice: 1000,
        maxPrice: 5000,
        dateFrom: DateTime.now().minus({ days: 30 }).toISO(),
        dateTo: DateTime.now().toISO(),
        transactionType: ApiTransactionType.EXPENSE,
        categoryIds: [categoryId],
      };

      const response = await api.filters.filterControllerCreate(filterDto);
      expect([200, 201]).toContain(response.status);

      const filterResponse = response.data;
      expect(filterResponse).toHaveProperty("id");
      expect(filterResponse.title).toBe(filterDto.title);
      expect(filterResponse.minPrice).toBe(filterDto.minPrice);
      expect(filterResponse.maxPrice).toBe(filterDto.maxPrice);
      expect(filterResponse.transactionType).toBe(filterDto.transactionType);

      filterId = filterResponse.id;
    });

    it("should create a filter with minimal data", async () => {
      const filterDto = {
        title: `Minimal Filter ${Math.random().toString(36).substring(2, 9)}`,
      };

      const response = await api.filters.filterControllerCreate(filterDto);
      expect([200, 201]).toContain(response.status);

      const filterResponse = response.data;
      expect(filterResponse).toHaveProperty("id");
      expect(filterResponse.title).toBe(filterDto.title);
    });
  });

  describe("GET /filters/list", () => {
    it("should list filters", async () => {
      const response = await api.filters.filterControllerList();
      expect([200, 201]).toContain(response.status);

      const filters = response.data;
      expect(Array.isArray(filters)).toBe(true);
      expect(filters.length).toBeGreaterThan(0);
      expect(filters[0]).toHaveProperty("id");
      expect(filters[0]).toHaveProperty("title");
    });
  });

  describe("PUT /filters/:id", () => {
    it("should update a filter", async () => {
      const updateDto = {
        title: "Updated Filter Title",
        minPrice: 2000,
        maxPrice: 6000,
      };

      const response = await api.filters.filterControllerUpdate(filterId, updateDto);
      expect(response.status).toBe(200);

      const updatedFilter = response.data;
      expect(updatedFilter.id).toBe(filterId);
      expect(updatedFilter.title).toBe(updateDto.title);
      expect(updatedFilter.minPrice).toBe(updateDto.minPrice);
      expect(updatedFilter.maxPrice).toBe(updateDto.maxPrice);
    });

    it("should fail to update non-existent filter", async () => {
      const response = await api.filters.filterControllerUpdate(99999, { title: "Test" });
      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /filters/:id", () => {
    it("should delete a filter", async () => {
      // Create a filter to delete
      const filterDto = {
        title: `Delete Me ${Math.random().toString(36).substring(2, 9)}`,
      };

      const createResponse = await api.filters.filterControllerCreate(filterDto);
      expect([200, 201]).toContain(createResponse.status);

      const deleteFilterId = createResponse.data.id;

      // Delete the filter
      const deleteResponse = await api.filters.filterControllerDelete(deleteFilterId);
      expect(deleteResponse.status).toBe(200);

      // Verify filter is deleted
      const updateResponse = await api.filters.filterControllerUpdate(deleteFilterId, { title: "Test" });
      expect(updateResponse.status).toBe(404);
    });
  });
});