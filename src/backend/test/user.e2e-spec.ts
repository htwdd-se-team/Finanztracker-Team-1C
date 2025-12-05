import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { App } from "supertest/types";

import { UserBalanceResponseDto } from "../src/dto/user.dto";

import { registerTestUser } from "./helpers/auth-helper";
import { createTestApp } from "./helpers/test-app";

describe("UserController (e2e)", () => {
  let app: INestApplication<App>;
  let testUser: Awaited<ReturnType<typeof registerTestUser>>;

  beforeAll(async () => {
    app = await createTestApp();
    testUser = await registerTestUser(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /user/me", () => {
    it("should get current user info", async () => {
      const response = await request(app.getHttpServer())
        .get("/user/me")
        .set("Authorization", `Bearer ${testUser.token}`)
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      expect(response.body).toHaveProperty("email", testUser.email);
      expect(response.body).toHaveProperty("givenName");
      expect(response.body).toHaveProperty("familyName");
      expect(response.body).toHaveProperty("createdAt");
    });

    it("should fail to access without token", async () => {
      await request(app.getHttpServer()).get("/user/me").expect(401);
    });

    it("should fail to access with invalid token", async () => {
      await request(app.getHttpServer())
        .get("/user/me")
        .set("Authorization", "Bearer invalid_token_12345")
        .expect(401);
    });
  });

  describe("GET /user/balance", () => {
    it("should get user balance", async () => {
      const response = await request(app.getHttpServer())
        .get("/user/balance")
        .set("Authorization", `Bearer ${testUser.token}`)
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const balanceResponse = response.body as UserBalanceResponseDto;
      expect(balanceResponse).toHaveProperty("balance");
      expect(balanceResponse).toHaveProperty("transactionCount");
      expect(typeof balanceResponse.balance).toBe("number");
      expect(typeof balanceResponse.transactionCount).toBe("number");
    });

    it("should return zero balance for new user", async () => {
      const newUser = await registerTestUser(app);
      const response = await request(app.getHttpServer())
        .get("/user/balance")
        .set("Authorization", `Bearer ${newUser.token}`)
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const balanceResponse = response.body as UserBalanceResponseDto;
      expect(balanceResponse.balance).toBe(0);
      expect(balanceResponse.transactionCount).toBe(0);
    });
  });
});
