import { INestApplication } from "@nestjs/common";
import { App } from "supertest/types";
import { Api } from "api-client";
import * as fs from 'fs';
import * as path from 'path';
import { registerTestUser } from "./helpers/auth-helper";
import { createTestApp } from "./helpers/test-app";

describe("ImportController (e2e)", () => {
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
    api.setSecurityData(testUser.token);
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /entries/import", () => {
    it("should import entries from CSV file", async () => {
      const csvFilePath = path.join(__dirname, 'import_bank.csv');
      const csvContent = fs.readFileSync(csvFilePath);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'import_bank.csv', { type: 'text/csv' });

      // @ts-ignore - bypassing strict type check to test file upload
      const response = await api.entries.entryControllerImportEntries({
        files: [file]
      });

      expect([200, 201]).toContain(response.status);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      // Verify some imported data
      const firstEntry = response.data[0];
      expect(firstEntry).toHaveProperty('amount');
      expect(firstEntry).toHaveProperty('description');
      expect(firstEntry).toHaveProperty('currency', 'EUR');
    });
  });
});
