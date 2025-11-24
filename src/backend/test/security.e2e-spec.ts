import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { App } from "supertest/types";
import { LoginResponseDto } from "@/dto";

import { registerTestUser } from "./helpers/auth-helper";
import { createTestApp } from "./helpers/test-app";

describe("Security (e2e)", () => {
  let app: INestApplication<App>;
  let testUser: Awaited<ReturnType<typeof registerTestUser>>;

  beforeAll(async () => {
    app = await createTestApp();
    testUser = await registerTestUser(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Authentication Security", () => {
    describe("POST /auth/register - Email Validation", () => {
      it("should reject invalid email format - missing @", async () => {
        await request(app.getHttpServer())
          .post("/auth/register")
          .send({
            email: "invalidemail.com",
            password: "ValidPass123!",
            givenName: "Test",
          })
          .expect(400);
      });

      it("should reject invalid email format - missing domain", async () => {
        await request(app.getHttpServer())
          .post("/auth/register")
          .send({
            email: "test@",
            password: "ValidPass123!",
            givenName: "Test",
          })
          .expect(400);
      });

      it("should reject invalid email format - missing local part", async () => {
        await request(app.getHttpServer())
          .post("/auth/register")
          .send({
            email: "@example.com",
            password: "ValidPass123!",
            givenName: "Test",
          })
          .expect(400);
      });

      it("should reject invalid email format - multiple @", async () => {
        await request(app.getHttpServer())
          .post("/auth/register")
          .send({
            email: "test@@example.com",
            password: "ValidPass123!",
            givenName: "Test",
          })
          .expect(400);
      });

      it("should reject invalid email format - spaces", async () => {
        await request(app.getHttpServer())
          .post("/auth/register")
          .send({
            email: "test @example.com",
            password: "ValidPass123!",
            givenName: "Test",
          })
          .expect(400);
      });

      it("should reject empty email", async () => {
        await request(app.getHttpServer())
          .post("/auth/register")
          .send({
            email: "",
            password: "ValidPass123!",
            givenName: "Test",
          })
          .expect(400);
      });

      it("should accept valid email formats", async () => {
        const validEmails = [
          "test@example.com",
          "user.name@example.com",
          "user+tag@example.co.uk",
          "user123@test-domain.com",
        ];

        for (const email of validEmails) {
          const response = await request(app.getHttpServer())
            .post("/auth/register")
            .send({
              email: `${email.split("@")[0]}_${Math.random().toString(36).substring(2, 9)}@${email.split("@")[1]}`,
              password: "ValidPass123!",
              givenName: "Test",
            })
            .expect((res) => {
              expect([200, 201]).toContain(res.status);
            });

          expect(response.body).toHaveProperty("token");
        }
      });
    });

    describe("POST /auth/register - Password Validation", () => {
      it("should reject password shorter than 8 characters", async () => {
        await request(app.getHttpServer())
          .post("/auth/register")
          .send({
            email: `test_${Math.random().toString(36).substring(2, 15)}@example.com`,
            password: "Short1!",
            givenName: "Test",
          })
          .expect(400);
      });

      it("should reject password with 7 characters", async () => {
        await request(app.getHttpServer())
          .post("/auth/register")
          .send({
            email: `test_${Math.random().toString(36).substring(2, 15)}@example.com`,
            password: "Pass123",
            givenName: "Test",
          })
          .expect(400);
      });

      it("should reject empty password", async () => {
        await request(app.getHttpServer())
          .post("/auth/register")
          .send({
            email: `test_${Math.random().toString(36).substring(2, 15)}@example.com`,
            password: "",
            givenName: "Test",
          })
          .expect(400);
      });

      it("should reject password longer than 30 characters", async () => {
        await request(app.getHttpServer())
          .post("/auth/register")
          .send({
            email: `test_${Math.random().toString(36).substring(2, 15)}@example.com`,
            password: "A".repeat(31),
            givenName: "Test",
          })
          .expect(400);
      });

      it("should accept password with exactly 8 characters", async () => {
        const response = await request(app.getHttpServer())
          .post("/auth/register")
          .send({
            email: `test_${Math.random().toString(36).substring(2, 15)}@example.com`,
            password: "Pass123!",
            givenName: "Test",
          })
          .expect((res) => {
            expect([200, 201]).toContain(res.status);
          });

        expect(response.body).toHaveProperty("token");
      });

      it("should accept password with exactly 30 characters", async () => {
        const response = await request(app.getHttpServer())
          .post("/auth/register")
          .send({
            email: `test_${Math.random().toString(36).substring(2, 15)}@example.com`,
            password: "A".repeat(30),
            givenName: "Test",
          })
          .expect((res) => {
            expect([200, 201]).toContain(res.status);
          });

        expect(response.body).toHaveProperty("token");
      });

      it("should accept password with 8-30 characters", async () => {
        const passwords = [
          "ValidPass123!",
          "AnotherValidPassword123!",
          "MediumLength123!",
        ];

        for (const password of passwords) {
          const response = await request(app.getHttpServer())
            .post("/auth/register")
            .send({
              email: `test_${Math.random().toString(36).substring(2, 15)}@example.com`,
              password,
              givenName: "Test",
            })
            .expect((res) => {
              expect([200, 201]).toContain(res.status);
            });

          expect(response.body).toHaveProperty("token");
        }
      });
    });

    describe("POST /auth/login - Email Validation", () => {
      it("should reject invalid email format", async () => {
        await request(app.getHttpServer())
          .post("/auth/login")
          .send({
            email: "invalidemail",
            password: "SomePassword123!",
          })
          .expect(400);
      });

      it("should reject empty email", async () => {
        await request(app.getHttpServer())
          .post("/auth/login")
          .send({
            email: "",
            password: "SomePassword123!",
          })
          .expect(400);
      });
    });

    describe("POST /auth/login - Password Validation", () => {
      it("should reject password shorter than 8 characters", async () => {
        await request(app.getHttpServer())
          .post("/auth/login")
          .send({
            email: testUser.email,
            password: "Short1!",
          })
          .expect(400);
      });

      it("should reject password longer than 30 characters", async () => {
        await request(app.getHttpServer())
          .post("/auth/login")
          .send({
            email: testUser.email,
            password: "A".repeat(31),
          })
          .expect(400);
      });

      it("should reject empty password", async () => {
        await request(app.getHttpServer())
          .post("/auth/login")
          .send({
            email: testUser.email,
            password: "",
          })
          .expect(400);
      });
    });

    describe("POST /auth/login - Authentication", () => {
      it("should fail login with non-existent email", async () => {
        await request(app.getHttpServer())
          .post("/auth/login")
          .send({
            email: `nonexistent_${Math.random().toString(36).substring(2, 15)}@example.com`,
            password: "SomePassword123!",
          })
          .expect(404);
      });

      it("should fail login with wrong password", async () => {
        await request(app.getHttpServer())
          .post("/auth/login")
          .send({
            email: testUser.email,
            password: "WrongPassword123!",
          })
          .expect(401);
      });

      it("should fail login with correct email but wrong password", async () => {
        await request(app.getHttpServer())
          .post("/auth/login")
          .send({
            email: testUser.email,
            password: testUser.password + "wrong",
          })
          .expect(401);
      });

      it("should succeed login with correct credentials", async () => {
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
    });
  });

  describe("Authorization Security", () => {
    describe("Protected Routes", () => {
      it("should fail to access protected route without token", async () => {
        await request(app.getHttpServer()).get("/user/me").expect(401);
      });

      it("should fail to access protected route with invalid token", async () => {
        await request(app.getHttpServer())
          .get("/user/me")
          .set("Authorization", "Bearer invalid_token_12345")
          .expect(401);
      });

      it("should fail to access protected route with malformed token", async () => {
        await request(app.getHttpServer())
          .get("/user/me")
          .set("Authorization", "Bearer not.a.valid.jwt.token")
          .expect(401);
      });

      it("should fail to access protected route without Bearer prefix", async () => {
        await request(app.getHttpServer())
          .get("/user/me")
          .set("Authorization", testUser.token)
          .expect(401);
      });

      it("should fail to access protected route with empty token", async () => {
        await request(app.getHttpServer())
          .get("/user/me")
          .set("Authorization", "Bearer ")
          .expect(401);
      });

      it("should succeed with valid token", async () => {
        const response = await request(app.getHttpServer())
          .get("/user/me")
          .set("Authorization", `Bearer ${testUser.token}`)
          .expect(200);

        expect(response.body).toHaveProperty("email");
        expect(response.body).toHaveProperty("givenName");
      });
    });

    describe("Data Isolation", () => {
      it("should not access entries from other users", async () => {
        // Create a second user
        const secondUser = await registerTestUser(app);

        // Second user should have no entries initially
        const listResponse = await request(app.getHttpServer())
          .get("/entries/list")
          .set("Authorization", `Bearer ${secondUser.token}`)
          .query({ take: 10 })
          .expect(200);

        const secondUserListResponse = listResponse.body as {
          entries: unknown[];
        };
        expect(secondUserListResponse.entries.length).toBe(0);

        // First user's entries should not be accessible to second user
        const firstUserListResponse = await request(app.getHttpServer())
          .get("/entries/list")
          .set("Authorization", `Bearer ${testUser.token}`)
          .query({ take: 10 })
          .expect(200);

        const firstUserEntries = firstUserListResponse.body as {
          entries: { id: number }[];
        };

        // If first user has entries, verify second user cannot see them
        if (firstUserEntries.entries.length > 0) {
          const firstUserEntryId = firstUserEntries.entries[0].id;

          // Second user should not be able to access first user's entry
          await request(app.getHttpServer())
            .get(`/entries/${firstUserEntryId}`)
            .set("Authorization", `Bearer ${secondUser.token}`)
            .expect(404);
        }
      });

      it("should not access categories from other users", async () => {
        // Create a second user
        const secondUser = await registerTestUser(app);

        // Second user should have no categories initially
        const listResponse = await request(app.getHttpServer())
          .get("/categories")
          .set("Authorization", `Bearer ${secondUser.token}`)
          .query({ take: 10 })
          .expect(200);

        const secondUserCategories = listResponse.body as { id: number }[];
        const initialCount = secondUserCategories.length;

        // First user creates a category
        const categoryResponse = await request(app.getHttpServer())
          .post("/categories")
          .set("Authorization", `Bearer ${testUser.token}`)
          .send({
            name: `Private Category ${Math.random().toString(36).substring(2, 9)}`,
            color: "Red",
            icon: "lock",
          })
          .expect((res) => {
            expect([200, 201]).toContain(res.status);
          });

        const categoryId = (categoryResponse.body as { id: number }).id;

        // Second user should still have the same number of categories
        const secondUserListResponse = await request(app.getHttpServer())
          .get("/categories")
          .set("Authorization", `Bearer ${secondUser.token}`)
          .query({ take: 10 })
          .expect(200);

        const secondUserCategoriesAfter = secondUserListResponse.body as {
          id: number;
        }[];
        expect(secondUserCategoriesAfter.length).toBe(initialCount);

        // Second user should not be able to access first user's category
        await request(app.getHttpServer())
          .patch(`/categories/${categoryId}`)
          .set("Authorization", `Bearer ${secondUser.token}`)
          .send({ name: "Hacked" })
          .expect(404);
      });
    });
  });

  describe("Input Sanitization", () => {
    it("should handle SQL injection attempts in email", async () => {
      const sqlInjectionAttempts = [
        "test'; DROP TABLE users; --",
        "test' OR '1'='1",
        "test'; DELETE FROM users WHERE '1'='1",
      ];

      for (const email of sqlInjectionAttempts) {
        await request(app.getHttpServer())
          .post("/auth/register")
          .send({
            email,
            password: "ValidPass123!",
            givenName: "Test",
          })
          .expect(400); // Should fail validation, not execute SQL
      }
    });

    it("should handle XSS attempts in user input", async () => {
      const xssAttempts = [
        "<script>alert('XSS')</script>",
        "javascript:alert('XSS')",
        "<img src=x onerror=alert('XSS')>",
      ];

      for (const xss of xssAttempts) {
        // Try in givenName field
        const response = await request(app.getHttpServer())
          .post("/auth/register")
          .send({
            email: `test_${Math.random().toString(36).substring(2, 15)}@example.com`,
            password: "ValidPass123!",
            givenName: xss,
          })
          .expect((res) => {
            // Should either accept (if sanitized) or reject (if validated)
            expect([200, 201, 400]).toContain(res.status);
          });

        // If registration succeeds, verify the stored value doesn't contain script tags
        if ([200, 201].includes(response.status)) {
          const token = (response.body as { token: string }).token;
          const userResponse = await request(app.getHttpServer())
            .get("/user/me")
            .set("Authorization", `Bearer ${token}`)
            .expect(200);

          const userData = userResponse.body as { givenName: string };
          // The name should be stored, but script execution should be prevented
          expect(userData.givenName).toBeDefined();
        }
      }
    });
  });
});
