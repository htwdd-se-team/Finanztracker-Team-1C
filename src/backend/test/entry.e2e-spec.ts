import { INestApplication } from "@nestjs/common";
import { TransactionType } from "@prisma/client";
import * as request from "supertest";
import { App } from "supertest/types";
import {
  CategoryResponseDto,
  Currency,
  EntryPageDto,
  EntryResponseDto,
  ScheduledEntriesResponseDto,
} from "@/dto";

import { registerTestUser } from "./helpers/auth-helper";
import { createTestApp } from "./helpers/test-app";

describe("EntryController (e2e)", () => {
  let app: INestApplication<App>;
  let testUser: Awaited<ReturnType<typeof registerTestUser>>;
  let categoryId: number;
  let entryId: number;

  beforeAll(async () => {
    app = await createTestApp();
    testUser = await registerTestUser(app);

    // Create a category for entries
    const categoryResponse = await request(app.getHttpServer())
      .post("/categories")
      .set("Authorization", `Bearer ${testUser.token}`)
      .send({
        name: `Test Category ${Math.random().toString(36).substring(2, 9)}`,
        color: "Blue",
        icon: "shopping-cart",
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const createdCategory = categoryResponse.body as CategoryResponseDto;
    categoryId = createdCategory.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /entries/create", () => {
    it("should create an expense entry", async () => {
      const entryDto = {
        type: TransactionType.EXPENSE,
        amount: 1999, // 19.99 EUR in cents
        description: "Test grocery purchase",
        currency: Currency.EUR,
        categoryId: categoryId,
      };

      const response = await request(app.getHttpServer())
        .post("/entries/create")
        .set("Authorization", `Bearer ${testUser.token}`)
        .send(entryDto)
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const entryResponse = response.body as EntryResponseDto;
      expect(entryResponse).toHaveProperty("id");
      expect(entryResponse.type).toBe(TransactionType.EXPENSE);
      expect(entryResponse.amount).toBe(entryDto.amount);
      expect(entryResponse.description).toBe(entryDto.description);
      expect(entryResponse.currency).toBe(Currency.EUR);
      expect(entryResponse.categoryId).toBe(categoryId);

      entryId = entryResponse.id;
    });

    it("should create an income entry", async () => {
      const entryDto = {
        type: TransactionType.INCOME,
        amount: 50000, // 500.00 EUR in cents
        description: "Test salary payment",
        currency: Currency.EUR,
      };

      const response = await request(app.getHttpServer())
        .post("/entries/create")
        .set("Authorization", `Bearer ${testUser.token}`)
        .send(entryDto)
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const entryResponse = response.body as EntryResponseDto;
      expect(entryResponse).toHaveProperty("id");
      expect(entryResponse.type).toBe(TransactionType.INCOME);
      expect(entryResponse.amount).toBe(entryDto.amount);
    });
  });

  describe("GET /entries/list", () => {
    it("should list entries", async () => {
      const response = await request(app.getHttpServer())
        .get("/entries/list")
        .set("Authorization", `Bearer ${testUser.token}`)
        .query({ take: 10 })
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const listResponse = response.body as EntryPageDto;
      expect(listResponse).toHaveProperty("entries");
      expect(Array.isArray(listResponse.entries)).toBe(true);
      expect(listResponse.entries.length).toBeGreaterThan(0);
      expect(listResponse.entries[0]).toHaveProperty("id");
      expect(listResponse.entries[0]).toHaveProperty("type");
      expect(listResponse.entries[0]).toHaveProperty("amount");
    });

    it("should filter entries by type", async () => {
      const response = await request(app.getHttpServer())
        .get("/entries/list")
        .set("Authorization", `Bearer ${testUser.token}`)
        .query({
          take: 10,
          transactionType: TransactionType.EXPENSE,
        })
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const filterResponse = response.body as EntryPageDto;
      expect(filterResponse).toHaveProperty("entries");
      expect(Array.isArray(filterResponse.entries)).toBe(true);
      // All entries should be expenses
      expect(
        filterResponse.entries.every(
          (entry) => entry.type === TransactionType.EXPENSE,
        ),
      ).toBe(true);
    });
  });

  describe("PATCH /entries/:id", () => {
    it("should update an entry", async () => {
      const updateDto = {
        amount: 2499, // Updated amount
        description: "Updated description",
      };

      const response = await request(app.getHttpServer())
        .patch(`/entries/${entryId}`)
        .set("Authorization", `Bearer ${testUser.token}`)
        .send(updateDto)
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const updateResponse = response.body as EntryResponseDto;
      expect(updateResponse.id).toBe(entryId);
      expect(updateResponse.amount).toBe(updateDto.amount);
      expect(updateResponse.description).toBe(updateDto.description);
    });
  });

  describe("DELETE /entries/:id", () => {
    it("should delete an entry", async () => {
      // Create a new entry to delete
      const entryDto = {
        type: TransactionType.EXPENSE,
        amount: 1000,
        description: "Entry to be deleted",
        currency: Currency.EUR,
      };

      const createResponse = await request(app.getHttpServer())
        .post("/entries/create")
        .set("Authorization", `Bearer ${testUser.token}`)
        .send(entryDto)
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const createEntryResponse = createResponse.body as EntryResponseDto;
      const deleteEntryId = createEntryResponse.id;

      // Delete the entry
      await request(app.getHttpServer())
        .delete(`/entries/${deleteEntryId}`)
        .set("Authorization", `Bearer ${testUser.token}`)
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      // Verify entry is deleted
      await request(app.getHttpServer())
        .patch(`/entries/${deleteEntryId}`)
        .set("Authorization", `Bearer ${testUser.token}`)
        .send({ amount: 2000 })
        .expect(404);
    });
  });

  describe("Scheduled Entries", () => {
    it("should list scheduled entries", async () => {
      const response = await request(app.getHttpServer())
        .get("/entries/scheduled-entries/list")
        .set("Authorization", `Bearer ${testUser.token}`)
        .query({ take: 10 })
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const scheduledEntriesResponse =
        response.body as ScheduledEntriesResponseDto;

      expect(scheduledEntriesResponse).toHaveProperty("entries");
      expect(scheduledEntriesResponse).toHaveProperty("count");
      expect(Array.isArray(scheduledEntriesResponse.entries)).toBe(true);
    });
  });
});
