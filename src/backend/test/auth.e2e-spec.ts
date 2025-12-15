import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { App } from "supertest/types";

import { LoginResponseDto } from "../src/dto/auth.dto";

import { registerTestUser } from "./helpers/auth-helper";
import { createTestApp } from "./helpers/test-app";

describe("AuthController (e2e)", () => {
  let app: INestApplication<App>;
  let testUser: Awaited<ReturnType<typeof registerTestUser>>;

  beforeAll(async () => {
    app = await createTestApp();
    testUser = await registerTestUser(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /auth/register", () => {
    it("should register a new user and return JWT token", async () => {
      const user = await registerTestUser(app);

      expect(user.token).toBeDefined();
      expect(typeof user.token).toBe("string");
      expect(user.token.length).toBeGreaterThan(0);
      expect(user.email).toBeDefined();
      expect(user.password).toBeDefined();
    });

    it("should fail to register with duplicate email", async () => {
      await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: testUser.email,
          password: "DifferentPassword123!",
          givenName: "Duplicate",
          familyName: "User",
        })
        .expect(400);
    });
  });

  describe("POST /auth/login", () => {
    it("should login with valid credentials", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const authResponse = response.body as LoginResponseDto;
      expect(authResponse).toHaveProperty("token");
      expect(typeof authResponse.token).toBe("string");
      expect(authResponse.token.length).toBeGreaterThan(0);
    });

    it("should fail login with wrong password", async () => {
      await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: testUser.email,
          password: "wrongpassword123",
        })
        .expect(401);
    });

    it("should fail login with non-existent email", async () => {
      await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "SomePassword123!",
        })
        .expect(404);
    });
  });
});
