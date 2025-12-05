import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { App } from "supertest/types";

import { CategoryResponseDto } from "../src/dto/category-response.dto";

import { registerTestUser } from "./helpers/auth-helper";
import { createTestApp } from "./helpers/test-app";

describe("CategoryController (e2e)", () => {
  let app: INestApplication<App>;
  let testUser: Awaited<ReturnType<typeof registerTestUser>>;
  let categoryId: number;

  beforeAll(async () => {
    app = await createTestApp();
    testUser = await registerTestUser(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /categories", () => {
    it("should create a category", async () => {
      const categoryDto = {
        name: `Test Category ${Math.random().toString(36).substring(2, 9)}`,
        color: "Blue",
        icon: "shopping-cart",
      };

      const response = await request(app.getHttpServer())
        .post("/categories")
        .set("Authorization", `Bearer ${testUser.token}`)
        .send(categoryDto)
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const categoryResponse = response.body as CategoryResponseDto;
      expect(categoryResponse).toHaveProperty("id");
      expect(categoryResponse.name).toBe(categoryDto.name);
      expect(categoryResponse.color).toBe(categoryDto.color);
      expect(categoryResponse.icon).toBe(categoryDto.icon);

      categoryId = categoryResponse.id;
    });
  });

  describe("GET /categories", () => {
    it("should list categories", async () => {
      const response = await request(app.getHttpServer())
        .get("/categories")
        .set("Authorization", `Bearer ${testUser.token}`)
        .query({ take: 10 })
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const categories = response.body as CategoryResponseDto[];
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0]).toHaveProperty("id");
      expect(categories[0]).toHaveProperty("name");
    });
  });

  describe("PATCH /categories/:id", () => {
    it("should update a category", async () => {
      const updateDto = {
        name: "Updated Category Name",
        color: "Red",
        icon: "tag",
      };

      const response = await request(app.getHttpServer())
        .patch(`/categories/${categoryId}`)
        .set("Authorization", `Bearer ${testUser.token}`)
        .send(updateDto)
        .expect(200);

      const updatedCategory = response.body as CategoryResponseDto;
      expect(updatedCategory.id).toBe(categoryId);
      expect(updatedCategory.name).toBe(updateDto.name);
      expect(updatedCategory.color).toBe(updateDto.color);
      expect(updatedCategory.icon).toBe(updateDto.icon);
    });

    it("should fail to update non-existent category", async () => {
      await request(app.getHttpServer())
        .patch("/categories/99999")
        .set("Authorization", `Bearer ${testUser.token}`)
        .send({ name: "Test" })
        .expect(404);
    });
  });

  describe("DELETE /categories/:id", () => {
    it("should delete a category", async () => {
      // Create a category to delete
      const categoryDto = {
        name: `Delete Me ${Math.random().toString(36).substring(2, 9)}`,
        color: "Green",
        icon: "trash",
      };

      const createResponse = await request(app.getHttpServer())
        .post("/categories")
        .set("Authorization", `Bearer ${testUser.token}`)
        .send(categoryDto)
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const createdCategory = createResponse.body as CategoryResponseDto;
      const deleteCategoryId = createdCategory.id;

      // Delete the category
      await request(app.getHttpServer())
        .delete(`/categories/${deleteCategoryId}`)
        .set("Authorization", `Bearer ${testUser.token}`)
        .expect(200);

      // Verify category is deleted
      await request(app.getHttpServer())
        .patch(`/categories/${deleteCategoryId}`)
        .set("Authorization", `Bearer ${testUser.token}`)
        .send({ name: "Test" })
        .expect(404);
    });
  });
});
