import { INestApplication } from "@nestjs/common";
import { App } from "supertest/types";
import { Api } from "api-client";
import { registerTestUser } from "./helpers/auth-helper";
import { createTestApp } from "./helpers/test-app";

describe("CategoryController (e2e)", () => {
  let app: INestApplication<App>;
  let url: string;
  let testUser: Awaited<ReturnType<typeof registerTestUser>>;
  let api: Api<string>;
  let categoryId: number;

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

  describe("POST /categories", () => {
    it("should create a category", async () => {
      const categoryDto = {
        name: `Test Category ${Math.random().toString(36).substring(2, 9)}`,
        color: "Blue",
        icon: "shopping-cart",
      };

      const response = await api.categories.categoryControllerCreate(categoryDto);
      expect([200, 201]).toContain(response.status);

      const categoryResponse = response.data;
      expect(categoryResponse).toHaveProperty("id");
      expect(categoryResponse.name).toBe(categoryDto.name);
      expect(categoryResponse.color).toBe(categoryDto.color);
      expect(categoryResponse.icon).toBe(categoryDto.icon);

      categoryId = categoryResponse.id;
    });
  });

  describe("GET /categories", () => {
    it("should list categories", async () => {
      const response = await api.categories.categoryControllerList({ take: 10 });
      expect([200, 201]).toContain(response.status);

      const categories = response.data;
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

      const response = await api.categories.categoryControllerUpdate(categoryId, updateDto);
      expect(response.status).toBe(200);

      const updatedCategory = response.data;
      expect(updatedCategory.id).toBe(categoryId);
      expect(updatedCategory.name).toBe(updateDto.name);
      expect(updatedCategory.color).toBe(updateDto.color);
      expect(updatedCategory.icon).toBe(updateDto.icon);
    });

    it("should fail to update non-existent category", async () => {
      const response = await api.categories.categoryControllerUpdate(99999, { name: "Test" });
      expect(response.status).toBe(404);
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

      const createResponse = await api.categories.categoryControllerCreate(categoryDto);
      expect([200, 201]).toContain(createResponse.status);

      const deleteCategoryId = createResponse.data.id;

      // Delete the category
      const deleteResponse = await api.categories.categoryControllerDelete(deleteCategoryId);
      expect(deleteResponse.status).toBe(200);

      // Verify category is deleted
      const updateResponse = await api.categories.categoryControllerUpdate(deleteCategoryId, { name: "Test" });
      expect(updateResponse.status).toBe(404);
    });
  });
});