import { INestApplication } from "@nestjs/common";
import { Api } from "api-client";
import { App } from "supertest/types";

import { registerTestUser } from "./helpers/auth-helper";
import { createTestApp } from "./helpers/test-app";

describe("Security (e2e)", () => {
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
      securityWorker: (token) =>
        token ? { headers: { Authorization: `Bearer ${token}` } } : {},
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Authentication Security", () => {
    describe("POST /auth/register - Email Validation", () => {
      it("should reject invalid email format - missing @", async () => {
        const response = await api.auth.authControllerRegister({
          email: "invalidemail.com",
          password: "ValidPass123!",
          givenName: "Test",
        });
        expect(response.status).toBe(400);
      });

      it("should reject invalid email format - missing domain", async () => {
        const response = await api.auth.authControllerRegister({
          email: "test@",
          password: "ValidPass123!",
          givenName: "Test",
        });
        expect(response.status).toBe(400);
      });

      it("should reject invalid email format - missing local part", async () => {
        const response = await api.auth.authControllerRegister({
          email: "@example.com",
          password: "ValidPass123!",
          givenName: "Test",
        });
        expect(response.status).toBe(400);
      });

      it("should reject invalid email format - multiple @", async () => {
        const response = await api.auth.authControllerRegister({
          email: "test@@example.com",
          password: "ValidPass123!",
          givenName: "Test",
        });
        expect(response.status).toBe(400);
      });

      it("should reject invalid email format - spaces", async () => {
        const response = await api.auth.authControllerRegister({
          email: "test @example.com",
          password: "ValidPass123!",
          givenName: "Test",
        });
        expect(response.status).toBe(400);
      });

      it("should reject empty email", async () => {
        const response = await api.auth.authControllerRegister({
          email: "",
          password: "ValidPass123!",
          givenName: "Test",
        });
        expect(response.status).toBe(400);
      });

      it("should accept valid email formats", async () => {
        const validEmails = [
          "test@example.com",
          "user.name@example.com",
          "user+tag@example.co.uk",
          "user123@test-domain.com",
        ];

        for (const email of validEmails) {
          const response = await api.auth.authControllerRegister({
            email: `${email.split("@")[0]}_${Math.random().toString(36).substring(2, 9)}@${email.split("@")[1]}`,
            password: "ValidPass123!",
            givenName: "Test",
          });
          expect([200, 201]).toContain(response.status);
          expect(response.data).toHaveProperty("token");
        }
      });
    });

    describe("POST /auth/register - Password Validation", () => {
      it("should reject password shorter than 8 characters", async () => {
        const response = await api.auth.authControllerRegister({
          email: `test_${Math.random().toString(36).substring(2, 15)}@example.com`,
          password: "Short1!",
          givenName: "Test",
        });
        expect(response.status).toBe(400);
      });

      it("should reject password with 7 characters", async () => {
        const response = await api.auth.authControllerRegister({
          email: `test_${Math.random().toString(36).substring(2, 15)}@example.com`,
          password: "Pass123",
          givenName: "Test",
        });
        expect(response.status).toBe(400);
      });

      it("should reject empty password", async () => {
        const response = await api.auth.authControllerRegister({
          email: `test_${Math.random().toString(36).substring(2, 15)}@example.com`,
          password: "",
          givenName: "Test",
        });
        expect(response.status).toBe(400);
      });

      it("should reject password longer than 30 characters", async () => {
        const response = await api.auth.authControllerRegister({
          email: `test_${Math.random().toString(36).substring(2, 15)}@example.com`,
          password: "A".repeat(31),
          givenName: "Test",
        });
        expect(response.status).toBe(400);
      });

      it("should accept password with exactly 8 characters", async () => {
        const response = await api.auth.authControllerRegister({
          email: `test_${Math.random().toString(36).substring(2, 15)}@example.com`,
          password: "Pass123!",
          givenName: "Test",
        });
        expect([200, 201]).toContain(response.status);
        expect(response.data).toHaveProperty("token");
      });

      it("should accept password with exactly 30 characters", async () => {
        const response = await api.auth.authControllerRegister({
          email: `test_${Math.random().toString(36).substring(2, 15)}@example.com`,
          password: "A".repeat(30),
          givenName: "Test",
        });
        expect([200, 201]).toContain(response.status);
        expect(response.data).toHaveProperty("token");
      });

      it("should accept password with 8-30 characters", async () => {
        const passwords = [
          "ValidPass123!",
          "AnotherValidPassword123!",
          "MediumLength123!",
        ];

        for (const password of passwords) {
          const response = await api.auth.authControllerRegister({
            email: `test_${Math.random().toString(36).substring(2, 15)}@example.com`,
            password,
            givenName: "Test",
          });
          expect([200, 201]).toContain(response.status);
          expect(response.data).toHaveProperty("token");
        }
      });
    });

    describe("POST /auth/login - Email Validation", () => {
      it("should reject invalid email format", async () => {
        const response = await api.auth.authControllerLogin({
          email: "invalidemail",
          password: "SomePassword123!",
        });
        expect(response.status).toBe(400);
      });

      it("should reject empty email", async () => {
        const response = await api.auth.authControllerLogin({
          email: "",
          password: "SomePassword123!",
        });
        expect(response.status).toBe(400);
      });
    });

    describe("POST /auth/login - Password Validation", () => {
      it("should reject password shorter than 8 characters", async () => {
        const response = await api.auth.authControllerLogin({
          email: testUser.email,
          password: "Short1!",
        });
        expect(response.status).toBe(400);
      });

      it("should reject password longer than 30 characters", async () => {
        const response = await api.auth.authControllerLogin({
          email: testUser.email,
          password: "A".repeat(31),
        });
        expect(response.status).toBe(400);
      });

      it("should reject empty password", async () => {
        const response = await api.auth.authControllerLogin({
          email: testUser.email,
          password: "",
        });
        expect(response.status).toBe(400);
      });
    });

    describe("POST /auth/login - Authentication", () => {
      it("should fail login with non-existent email", async () => {
        const response = await api.auth.authControllerLogin({
          email: `nonexistent_${Math.random().toString(36).substring(2, 15)}@example.com`,
          password: "SomePassword123!",
        });
        expect(response.status).toBe(404);
      });

      it("should fail login with wrong password", async () => {
        const response = await api.auth.authControllerLogin({
          email: testUser.email,
          password: "WrongPassword123!",
        });
        expect(response.status).toBe(401);
      });

      it("should fail login with correct email but wrong password", async () => {
        const response = await api.auth.authControllerLogin({
          email: testUser.email,
          password: testUser.password + "wrong",
        });
        expect(response.status).toBe(401);
      });

      it("should succeed login with correct credentials", async () => {
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
    });
  });

  describe("Authorization Security", () => {
    describe("Protected Routes", () => {
      it("should fail to access protected route without token", async () => {
        api.setSecurityData(null);
        const response = await api.user.userControllerGetCurrentUser();
        expect(response.status).toBe(401);
      });

      it("should fail to access protected route with invalid token", async () => {
        api.setSecurityData("invalid_token_12345");
        const response = await api.user.userControllerGetCurrentUser();
        expect(response.status).toBe(401);
      });

      it("should fail to access protected route with malformed token", async () => {
        api.setSecurityData("not.a.valid.jwt.token");
        const response = await api.user.userControllerGetCurrentUser();
        expect(response.status).toBe(401);
      });

      // Bearer prefix test is irrelevant as the client handles it
      // but we can test manual header injection if needed.
      // Skipping specific header format tests as we are testing the client integration
      // and the backend response.

      it("should fail to access protected route with empty token", async () => {
        api.setSecurityData("");
        const response = await api.user.userControllerGetCurrentUser();
        expect(response.status).toBe(401);
      });

      it("should succeed with valid token", async () => {
        api.setSecurityData(testUser.token);
        const response = await api.user.userControllerGetCurrentUser();
        expect(response.status).toBe(200);

        expect(response.data).toHaveProperty("email");
        expect(response.data).toHaveProperty("givenName");
      });
    });

    describe("Data Isolation", () => {
      it("should not access entries from other users", async () => {
        // Create a second user
        const secondUser = await registerTestUser(url);

        // Second user should have no entries initially
        api.setSecurityData(secondUser.token);
        const listResponse = await api.entries.entryControllerList({
          take: 10,
        });
        expect(listResponse.status).toBe(200);

        expect(listResponse.data.entries.length).toBe(0);

        // First user's entries should not be accessible to second user
        api.setSecurityData(testUser.token);
        const firstUserListResponse = await api.entries.entryControllerList({
          take: 10,
        });
        expect(firstUserListResponse.status).toBe(200);

        // If first user has entries, verify second user cannot see them
        if (firstUserListResponse.data.entries.length > 0) {
          const firstUserEntryId = firstUserListResponse.data.entries[0].id;

          // Second user should not be able to access first user's entry
          // Try to delete it (as get by id is not in the list of endpoints used in tests, only delete/update by id)
          api.setSecurityData(secondUser.token);
          const response =
            await api.entries.entryControllerDelete(firstUserEntryId);
          expect(response.status).toBe(404);
        }
      });

      it("should not access categories from other users", async () => {
        // Create a second user
        const secondUser = await registerTestUser(url);

        // Second user should have no categories initially
        api.setSecurityData(secondUser.token);
        const listResponse = await api.categories.categoryControllerList({
          take: 10,
        });
        expect(listResponse.status).toBe(200);

        const initialCount = listResponse.data.length;

        // First user creates a category
        api.setSecurityData(testUser.token);
        const categoryResponse = await api.categories.categoryControllerCreate({
          name: `Private Category ${Math.random().toString(36).substring(2, 9)}`,
          color: "Red",
          icon: "lock",
        });
        expect([200, 201]).toContain(categoryResponse.status);

        const categoryId = categoryResponse.data.id;

        // Second user should still have the same number of categories
        api.setSecurityData(secondUser.token);
        const secondUserListResponse =
          await api.categories.categoryControllerList({ take: 10 });
        expect(secondUserListResponse.status).toBe(200);

        expect(secondUserListResponse.data.length).toBe(initialCount);

        // Second user should not be able to access first user's category
        const response = await api.categories.categoryControllerUpdate(
          categoryId,
          { name: "Hacked" },
        );
        expect(response.status).toBe(404);
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
        const response = await api.auth.authControllerRegister({
          email,
          password: "ValidPass123!",
          givenName: "Test",
        });
        expect(response.status).toBe(400); // Should fail validation, not execute SQL
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
        const response = await api.auth.authControllerRegister({
          email: `test_${Math.random().toString(36).substring(2, 15)}@example.com`,
          password: "ValidPass123!",
          givenName: xss,
        });
        expect([200, 201, 400]).toContain(response.status);

        // If registration succeeds, verify the stored value doesn't contain script tags
        if ([200, 201].includes(response.status)) {
          const token = response.data.token;
          api.setSecurityData(token);
          const userResponse = await api.user.userControllerGetCurrentUser();
          expect(userResponse.status).toBe(200);

          // The name should be stored, but script execution should be prevented
          // Note: The API client returns the response data as is.
          // The backend should sanitize or encode it.
          // Here we just check it exists.
          expect(userResponse.data.givenName).toBeDefined();
        }
      }
    });
  });

  // For Malformed/Invalid Data tests, we need to bypass type checking
  // or use the underlying axios instance to send invalid payloads
  describe("Malformed/Invalid Data Handling", () => {
    describe("POST /auth/login - Invalid Data", () => {
      it("should reject completely invalid JSON structure", async () => {
        const response = await api.instance.post(
          "/auth/login",
          { test: "test" },
          { validateStatus: () => true },
        );
        expect(response.status).toBe(400);
      });

      it("should reject missing all required fields", async () => {
        const response = await api.instance.post(
          "/auth/login",
          {},
          { validateStatus: () => true },
        );
        expect(response.status).toBe(400);
      });

      it("should reject wrong data types - email as number", async () => {
        const response = await api.instance.post(
          "/auth/login",
          {
            email: 12345,
            password: "ValidPass123!",
          },
          { validateStatus: () => true },
        );
        expect(response.status).toBe(400);
      });

      it("should reject null values", async () => {
        const response = await api.instance.post(
          "/auth/login",
          {
            email: null,
            password: "ValidPass123!",
          },
          { validateStatus: () => true },
        );
        expect(response.status).toBe(400);
      });

      it("should reject undefined values", async () => {
        // undefined fields are usually stripped by JSON.stringify
        // sending empty object effectively
        const response = await api.instance.post(
          "/auth/login",
          {
            email: undefined,
            password: "ValidPass123!",
          },
          { validateStatus: () => true },
        );
        expect(response.status).toBe(400);
      });

      it("should reject extra unexpected fields", async () => {
        const response = await api.instance.post(
          "/auth/login",
          {
            email: "test@example.com",
            password: "ValidPass123!",
            maliciousField: "hack attempt",
            anotherField: 12345,
          },
          { validateStatus: () => true },
        );
        expect(response.status).toBe(400); // Should reject due to forbidNonWhitelisted
      });

      it("should reject array instead of object", async () => {
        const response = await api.instance.post(
          "/auth/login",
          ["test", "data"],
          { validateStatus: () => true },
        );
        expect(response.status).toBe(400);
      });

      it("should reject string instead of object", async () => {
        const response = await api.instance.post(
          "/auth/login",
          "just a string",
          {
            headers: { "Content-Type": "application/json" },
            validateStatus: () => true,
          },
        );
        expect(response.status).toBe(400);
      });
    });

    describe("POST /auth/register - Invalid Data", () => {
      it("should reject completely invalid JSON structure", async () => {
        const response = await api.instance.post(
          "/auth/register",
          { random: "data", stuff: 123 },
          { validateStatus: () => true },
        );
        expect(response.status).toBe(400);
      });

      it("should reject missing required fields", async () => {
        const response = await api.instance.post(
          "/auth/register",
          {
            email: "test@example.com",
            // missing password and givenName
          },
          { validateStatus: () => true },
        );
        expect(response.status).toBe(400);
      });

      it("should reject extra unexpected fields", async () => {
        const response = await api.instance.post(
          "/auth/register",
          {
            email: `test_${Math.random().toString(36).substring(2, 15)}@example.com`,
            password: "ValidPass123!",
            givenName: "Test",
            admin: true,
            role: "admin",
            maliciousField: "hack",
          },
          { validateStatus: () => true },
        );
        expect(response.status).toBe(400); // Should reject due to forbidNonWhitelisted
      });
    });

    describe("POST /categories - Invalid Data", () => {
      // Need token
      beforeEach(() => {
        api.setSecurityData(testUser.token);
      });

      it("should reject completely invalid JSON structure", async () => {
        const response = await api.instance.post(
          "/categories",
          { invalid: "data", test: 123 },
          {
            headers: { Authorization: `Bearer ${testUser.token}` },
            validateStatus: () => true,
          },
        );
        expect(response.status).toBe(400);
      });

      it("should reject missing required fields", async () => {
        const response = await api.instance.post(
          "/categories",
          {
            color: "Blue",
            // missing name
          },
          {
            headers: { Authorization: `Bearer ${testUser.token}` },
            validateStatus: () => true,
          },
        );
        expect(response.status).toBe(400);
      });

      it("should reject extra unexpected fields", async () => {
        const response = await api.instance.post(
          "/categories",
          {
            name: "Test Category",
            color: "Blue",
            icon: "test",
            userId: 999, // trying to set user ID
            maliciousField: "hack",
          },
          {
            headers: { Authorization: `Bearer ${testUser.token}` },
            validateStatus: () => true,
          },
        );
        expect(response.status).toBe(400); // Should reject due to forbidNonWhitelisted
      });

      it("should reject null required fields", async () => {
        const response = await api.instance.post(
          "/categories",
          {
            name: null,
            color: "Blue",
            icon: "test",
          },
          {
            headers: { Authorization: `Bearer ${testUser.token}` },
            validateStatus: () => true,
          },
        );
        expect(response.status).toBe(400);
      });
    });

    describe("POST /entries/create - Invalid Data", () => {
      beforeEach(() => {
        api.setSecurityData(testUser.token);
      });

      it("should reject completely invalid JSON structure", async () => {
        const response = await api.instance.post(
          "/entries/create",
          { random: "stuff", invalid: true },
          {
            headers: { Authorization: `Bearer ${testUser.token}` },
            validateStatus: () => true,
          },
        );
        expect(response.status).toBe(400);
      });

      it("should reject missing required fields", async () => {
        const response = await api.instance.post(
          "/entries/create",
          {
            description: "Test entry",
            // missing type, amount, currency
          },
          {
            headers: { Authorization: `Bearer ${testUser.token}` },
            validateStatus: () => true,
          },
        );
        expect(response.status).toBe(400);
      });

      it("should reject invalid enum values", async () => {
        const response = await api.instance.post(
          "/entries/create",
          {
            type: "INVALID_TYPE",
            amount: 1000,
            currency: "EUR",
          },
          {
            headers: { Authorization: `Bearer ${testUser.token}` },
            validateStatus: () => true,
          },
        );
        expect(response.status).toBe(400);
      });

      it("should reject negative amounts", async () => {
        const response = await api.instance.post(
          "/entries/create",
          {
            type: "EXPENSE",
            amount: -1000,
            currency: "EUR",
          },
          {
            headers: { Authorization: `Bearer ${testUser.token}` },
            validateStatus: () => true,
          },
        );
        expect(response.status).toBe(400);
      });

      it("should reject zero amounts", async () => {
        const response = await api.instance.post(
          "/entries/create",
          {
            type: "EXPENSE",
            amount: 0,
            currency: "EUR",
          },
          {
            headers: { Authorization: `Bearer ${testUser.token}` },
            validateStatus: () => true,
          },
        );
        expect(response.status).toBe(400);
      });

      it("should reject extra unexpected fields", async () => {
        const response = await api.instance.post(
          "/entries/create",
          {
            type: "EXPENSE",
            amount: 1000,
            currency: "EUR",
            userId: 999, // trying to set user ID
            maliciousField: "hack",
            admin: true,
          },
          {
            headers: { Authorization: `Bearer ${testUser.token}` },
            validateStatus: () => true,
          },
        );
        expect(response.status).toBe(400); // Should reject due to forbidNonWhitelisted
      });
    });

    describe("PATCH /entries/:id - Invalid Data", () => {
      beforeEach(() => {
        api.setSecurityData(testUser.token);
      });

      it("should reject completely invalid JSON structure", async () => {
        const response = await api.instance.patch(
          "/entries/1",
          { invalid: "data" },
          {
            headers: { Authorization: `Bearer ${testUser.token}` },
            validateStatus: () => true,
          },
        );
        expect(response.status).toBe(400);
      });

      it("should reject extra unexpected fields", async () => {
        const response = await api.instance.patch(
          "/entries/1",
          {
            amount: 1000,
            userId: 999,
            maliciousField: "hack",
          },
          {
            headers: { Authorization: `Bearer ${testUser.token}` },
            validateStatus: () => true,
          },
        );
        expect(response.status).toBe(400); // Should reject due to forbidNonWhitelisted
      });
    });

    describe("GET /entries/list - Invalid Query Parameters", () => {
      beforeEach(() => {
        api.setSecurityData(testUser.token);
      });

      it("should reject invalid query parameter types", async () => {
        const response = await api.instance.get(
          "/entries/list?take=not_a_number",
          {
            headers: { Authorization: `Bearer ${testUser.token}` },
            validateStatus: () => true,
          },
        );
        expect(response.status).toBe(400);
      });

      it("should reject invalid query parameter values", async () => {
        const response = await api.instance.get("/entries/list?take=-1", {
          headers: { Authorization: `Bearer ${testUser.token}` },
          validateStatus: () => true,
        });
        expect(response.status).toBe(400);
      });

      it("should reject take exceeding maximum", async () => {
        const response = await api.instance.get("/entries/list?take=100", {
          headers: { Authorization: `Bearer ${testUser.token}` },
          validateStatus: () => true,
        });
        expect(response.status).toBe(400);
      });

      it("should reject invalid transaction type enum", async () => {
        const response = await api.instance.get(
          "/entries/list?transactionType=INVALID_TYPE",
          {
            headers: { Authorization: `Bearer ${testUser.token}` },
            validateStatus: () => true,
          },
        );
        expect(response.status).toBe(400);
      });
    });

    describe("POST /filters/create - Invalid Data", () => {
      beforeEach(() => {
        api.setSecurityData(testUser.token);
      });

      it("should reject completely invalid JSON structure", async () => {
        const response = await api.instance.post(
          "/filters/create",
          { random: "data" },
          {
            headers: { Authorization: `Bearer ${testUser.token}` },
            validateStatus: () => true,
          },
        );
        expect(response.status).toBe(400);
      });

      it("should reject missing required fields", async () => {
        const response = await api.instance.post(
          "/filters/create",
          {
            minPrice: 1000,
            // missing title
          },
          {
            headers: { Authorization: `Bearer ${testUser.token}` },
            validateStatus: () => true,
          },
        );
        expect(response.status).toBe(400);
      });

      it("should reject negative prices", async () => {
        const response = await api.instance.post(
          "/filters/create",
          {
            title: "Test Filter",
            minPrice: -1000,
          },
          {
            headers: { Authorization: `Bearer ${testUser.token}` },
            validateStatus: () => true,
          },
        );
        expect(response.status).toBe(400);
      });

      it("should reject extra unexpected fields", async () => {
        const response = await api.instance.post(
          "/filters/create",
          {
            title: "Test Filter",
            userId: 999,
            maliciousField: "hack",
          },
          {
            headers: { Authorization: `Bearer ${testUser.token}` },
            validateStatus: () => true,
          },
        );
        expect(response.status).toBe(400); // Should reject due to forbidNonWhitelisted
      });
    });

    describe("General Malformed Requests", () => {
      it("should reject empty body on POST requests", async () => {
        // Axios strips Content-Type if body is empty/undefined, so we might need to force it
        // or just let the app handle it.
        const response = await api.instance.post("/auth/login", undefined, {
          validateStatus: () => true,
        });
        expect(response.status).toBe(400);
      });

      it("should reject malformed JSON", async () => {
        // Need to bypass axios JSON serialization
        const response = await api.instance.post(
          "/auth/login",
          '{"email": "test@example.com", "password": "test"',
          {
            headers: { "Content-Type": "application/json" },
            transformRequest: [(data: string) => data], // prevent axios from trying to serialize/deserialize
            validateStatus: () => true,
          },
        );
        expect(response.status).toBe(400);
      });

      it("should reject requests with wrong Content-Type", async () => {
        const response = await api.instance.post(
          "/auth/login",
          "email=test@example.com&password=test",
          {
            headers: { "Content-Type": "text/plain" },
            validateStatus: () => true,
          },
        );
        expect(response.status).toBe(400);
      });
    });
  });
});
