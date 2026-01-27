import { INestApplication } from "@nestjs/common";
import { Api } from "api-client";
import { App } from "supertest/types";

import {
  generateRandomEmail,
  generateRandomPassword,
  generateRandomName,
} from "./helpers/auth-helper";
import { createTestApp } from "./helpers/test-app";

describe("DemoController (e2e)", () => {
  let app: INestApplication<App>;
  let url: string;
  let api: Api<string>;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    url = testApp.url;

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

  describe("POST /demo/create-account", () => {
    it("should create a demo account with populated data", async () => {
      const email = generateRandomEmail();
      const password = generateRandomPassword();
      const givenName = generateRandomName();

      // The api-client might not have generated the demo endpoint yet if it wasn't in the swagger doc when generated?
      // I need to check api.ts.
      // If not, I'll use api.instance.

      // Let's assume api-client is up to date or use raw request if missing.
      // The generate script was run recently.
      // Checking api.ts content from previous reads... it wasn't explicitly shown but the file is large.
      // I'll check api.ts content for "demo".
      // If not there, I use api.instance.

      const response = await api.instance.post("/demo/create-account", {
        email,
        password,
        givenName,
        familyName: "DemoUser",
      });

      expect([200, 201]).toContain(response.status);
      expect(response.data).toHaveProperty("token");

      const token = (response.data as { token: string }).token;

      // Verify data was created
      api.setSecurityData(token);

      // Check categories
      const categories = await api.categories.categoryControllerList({
        take: 30,
      });
      expect(categories.status).toBe(200);
      expect(categories.data.length).toBeGreaterThan(0);

      // Check transactions
      const entries = await api.entries.entryControllerList({ take: 30 });
      expect(entries.status).toBe(200);
      expect(entries.data.entries.length).toBeGreaterThan(0);

      // Check recurring entries
      const recurring = await api.entries.entryControllerGetScheduledEntries({
        take: 30,
      });
      expect(recurring.status).toBe(200);
      expect(recurring.data.count).toBeGreaterThan(0);
    });
  });
});
