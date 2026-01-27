import { INestApplication } from "@nestjs/common";
import { Api } from "api-client";
import { App } from "supertest/types";

import { createTestApp } from "./helpers/test-app";

describe("AppController (e2e)", () => {
  let app: INestApplication<App>;
  let url: string;

  beforeEach(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    url = testApp.url;
  });

  afterEach(async () => {
    await app.close();
  });

  it("/ (GET)", async () => {
    const api = new Api({ baseURL: url });
    const response = await api.appControllerGetHello();
    expect(response.status).toBe(200);
    expect(response.data).toBe("Hello World!");
  });
});
