import { INestApplication } from "@nestjs/common";
import { App } from "supertest/types";
import { Api } from "api-client";
import { registerTestUser } from "./helpers/auth-helper";
import { createTestApp } from "./helpers/test-app";

describe("UserController (e2e)", () => {
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /user/me", () => {
    it("should get current user info", async () => {
      api.setSecurityData(testUser.token);
      const response = await api.user.userControllerGetCurrentUser();
      
      expect([200, 201]).toContain(response.status);

      expect(response.data).toHaveProperty("email", testUser.email);
      expect(response.data).toHaveProperty("givenName");
      expect(response.data).toHaveProperty("familyName");
      expect(response.data).toHaveProperty("createdAt");
    });

    it("should fail to access without token", async () => {
      api.setSecurityData(null);
      const response = await api.user.userControllerGetCurrentUser();
      expect(response.status).toBe(401);
    });

    it("should fail to access with invalid token", async () => {
      api.setSecurityData("invalid_token_12345");
      const response = await api.user.userControllerGetCurrentUser();
      expect(response.status).toBe(401);
    });
  });

  describe("GET /user/balance", () => {
    it("should get user balance", async () => {
      api.setSecurityData(testUser.token);
      const response = await api.user.userControllerGetBalance();
      
      expect([200, 201]).toContain(response.status);

      expect(response.data).toHaveProperty("balance");
      expect(response.data).toHaveProperty("transactionCount");
      expect(typeof response.data.balance).toBe("number");
      expect(typeof response.data.transactionCount).toBe("number");
    });

    it("should return zero balance for new user", async () => {
      const newUser = await registerTestUser(url);
      api.setSecurityData(newUser.token);
      const response = await api.user.userControllerGetBalance();
      
      expect([200, 201]).toContain(response.status);

      expect(response.data.balance).toBe(0);
      expect(response.data.transactionCount).toBe(0);
    });
  });

  describe("POST /user/emergency-reserve", () => {
    it("should update emergency reserve", async () => {
      api.setSecurityData(testUser.token);
      const newReserve = 250000; // 2500.00 EUR
      
      const response = await api.user.userControllerUpdateEmergencyReserve({
        emergencyReserve: newReserve
      });
      
      expect(response.status).toBe(201);
      expect(response.data.emergencyReserve).toBe(newReserve);

      // Verify via getBalance
      const balanceResponse = await api.user.userControllerGetBalance();
      expect(balanceResponse.data.emergencyReserve).toBe(newReserve);
    });

    it("should fail with negative emergency reserve", async () => {
      api.setSecurityData(testUser.token);
      const response = await api.instance.post("/user/emergency-reserve", {
        emergencyReserve: -100
      }, { 
        headers: { Authorization: `Bearer ${testUser.token}` },
        validateStatus: () => true 
      });
      
      expect(response.status).toBe(400);
    });
  });
});