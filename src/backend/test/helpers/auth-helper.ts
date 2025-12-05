import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { App } from "supertest/types";

export interface TestUser {
  email: string;
  password: string;
  token: string;
}

/**
 * Generates a random email for testing
 */
export function generateRandomEmail(): string {
  const random = Math.random().toString(36).substring(2, 15);
  return `test_${random}@example.com`;
}

/**
 * Generates a random password for testing
 */
export function generateRandomPassword(): string {
  return `TestPass${Math.random().toString(36).substring(2, 15)}!`;
}

/**
 * Generates a random name for testing
 */
export function generateRandomName(): string {
  const names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"];
  return names[Math.floor(Math.random() * names.length)];
}

/**
 * Registers a new user and returns user credentials with JWT token
 */
export async function registerTestUser(
  app: INestApplication<App>,
): Promise<TestUser> {
  const email = generateRandomEmail();
  const password = generateRandomPassword();
  const givenName = generateRandomName();

  const response = await request(app.getHttpServer())
    .post("/auth/register")
    .send({
      email,
      password,
      givenName,
      familyName: "TestUser",
    })
    .expect((res) => {
      if (![200, 201].includes(res.status)) {
        throw new Error(`Expected status 200 or 201, got ${res.status}`);
      }
    });

  const body = response.body as { token: string };
  return {
    email,
    password,
    token: body.token,
  };
}

/**
 * Logs in an existing user and returns JWT token
 */
export async function loginTestUser(
  app: INestApplication<App>,
  email: string,
  password: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post("/auth/login")
    .send({ email, password })
    .expect((res) => {
      if (![200, 201].includes(res.status)) {
        throw new Error(`Expected status 200 or 201, got ${res.status}`);
      }
    });

  const body = response.body as { token: string };
  return body.token;
}
