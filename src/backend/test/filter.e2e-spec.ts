import { INestApplication } from "@nestjs/common";
import { TransactionType } from "@prisma/client";
import { DateTime } from "luxon";
import * as request from "supertest";
import { App } from "supertest/types";
import { CategoryResponseDto, Currency, FilterResponseDto } from "@/dto";

import { registerTestUser } from "./helpers/auth-helper";
import { createTestApp } from "./helpers/test-app";

describe("FilterController (e2e)", () => {
  let app: INestApplication<App>;
  let testUser: Awaited<ReturnType<typeof registerTestUser>>;
  let categoryId: number;
  let filterId: number;

  beforeAll(async () => {
    app = await createTestApp();
    testUser = await registerTestUser(app);

    // Create a category for filter tests
    const categoryResponse = await request(app.getHttpServer())
      .post("/categories")
      .set("Authorization", `Bearer ${testUser.token}`)
      .send({
        name: `Filter Category ${Math.random().toString(36).substring(2, 9)}`,
        color: "Purple",
        icon: "filter",
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const createdCategory = categoryResponse.body as CategoryResponseDto;
    categoryId = createdCategory.id;

    // Create some entries for filtering
    await request(app.getHttpServer())
      .post("/entries/create")
      .set("Authorization", `Bearer ${testUser.token}`)
      .send({
        type: TransactionType.EXPENSE,
        amount: 3000,
        description: "Filter test entry",
        currency: Currency.EUR,
        categoryId: categoryId,
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
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
        transactionType: TransactionType.EXPENSE,
        categoryIds: [categoryId],
      };

      const response = await request(app.getHttpServer())
        .post("/filters/create")
        .set("Authorization", `Bearer ${testUser.token}`)
        .send(filterDto)
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const filterResponse = response.body as FilterResponseDto;
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

      const response = await request(app.getHttpServer())
        .post("/filters/create")
        .set("Authorization", `Bearer ${testUser.token}`)
        .send(filterDto)
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const filterResponse = response.body as FilterResponseDto;
      expect(filterResponse).toHaveProperty("id");
      expect(filterResponse.title).toBe(filterDto.title);
    });
  });

  describe("GET /filters/list", () => {
    it("should list filters", async () => {
      const response = await request(app.getHttpServer())
        .get("/filters/list")
        .set("Authorization", `Bearer ${testUser.token}`)
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const filters = response.body as FilterResponseDto[];
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

      const response = await request(app.getHttpServer())
        .put(`/filters/${filterId}`)
        .set("Authorization", `Bearer ${testUser.token}`)
        .send(updateDto)
        .expect(200);

      const updatedFilter = response.body as FilterResponseDto;
      expect(updatedFilter.id).toBe(filterId);
      expect(updatedFilter.title).toBe(updateDto.title);
      expect(updatedFilter.minPrice).toBe(updateDto.minPrice);
      expect(updatedFilter.maxPrice).toBe(updateDto.maxPrice);
    });

    it("should fail to update non-existent filter", async () => {
      await request(app.getHttpServer())
        .put("/filters/99999")
        .set("Authorization", `Bearer ${testUser.token}`)
        .send({ title: "Test" })
        .expect(404);
    });
  });

  describe("DELETE /filters/:id", () => {
    it("should delete a filter", async () => {
      // Create a filter to delete
      const filterDto = {
        title: `Delete Me ${Math.random().toString(36).substring(2, 9)}`,
      };

      const createResponse = await request(app.getHttpServer())
        .post("/filters/create")
        .set("Authorization", `Bearer ${testUser.token}`)
        .send(filterDto)
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const createdFilter = createResponse.body as FilterResponseDto;
      const deleteFilterId = createdFilter.id;

      // Delete the filter
      await request(app.getHttpServer())
        .delete(`/filters/${deleteFilterId}`)
        .set("Authorization", `Bearer ${testUser.token}`)
        .expect(200);

      // Verify filter is deleted
      await request(app.getHttpServer())
        .put(`/filters/${deleteFilterId}`)
        .set("Authorization", `Bearer ${testUser.token}`)
        .send({ title: "Test" })
        .expect(404);
    });
  });
});
