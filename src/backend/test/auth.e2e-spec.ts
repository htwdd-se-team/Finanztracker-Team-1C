import { INestApplication } from "@nestjs/common";
import { App } from "supertest/types";
import { Api, ApiLoginDto } from "api-client";
import { registerTestUser } from "./helpers/auth-helper";
import { createTestApp } from "./helpers/test-app";

describe("AuthController (e2e)", () => {
  let app: INestApplication<App>;
  let url: string;
  let testUser: Awaited<ReturnType<typeof registerTestUser>>;
  let api: Api<unknown>;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    url = testApp.url;
    // Configure api to not throw on error status codes for testing negative cases
    api = new Api({ baseURL: url, validateStatus: () => true });
    testUser = await registerTestUser(url);
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /auth/register", () => {
    it("should register a new user and return JWT token", async () => {
      const user = await registerTestUser(url);

      expect(user.token).toBeDefined();
      expect(typeof user.token).toBe("string");
      expect(user.token.length).toBeGreaterThan(0);
      expect(user.email).toBeDefined();
      expect(user.password).toBeDefined();
    });

    it("should fail to register with duplicate email", async () => {
      const response = await api.auth.authControllerRegister({
        email: testUser.email,
        password: "DifferentPassword123!",
        givenName: "Duplicate",
        familyName: "User",
      });
      expect(response.status).toBe(400);
    });
  });

  describe("POST /auth/login", () => {
    it("should login with valid credentials", async () => {
      const response = await api.auth.authControllerLogin({
        email: testUser.email,
        password: testUser.password,
      });
      
      expect([200, 201]).toContain(response.status);

      const authResponse = response.data;
      expect(authResponse).toHaveProperty("token");
      expect(typeof authResponse.token).toBe("string");
      expect(authResponse.token.length).toBeGreaterThan(0);
    });

    it("should fail login with wrong password", async () => {
      const response = await api.auth.authControllerLogin({
        email: testUser.email,
        password: "wrongpassword123",
      });
      expect(response.status).toBe(401);
    });

    it("should fail login with non-existent email", async () => {
      const response = await api.auth.authControllerLogin({
        email: "nonexistent@example.com",
        password: "SomePassword123!",
      });
      expect(response.status).toBe(404);
    });
  });
});