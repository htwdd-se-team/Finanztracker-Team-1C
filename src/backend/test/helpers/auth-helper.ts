import { Api } from "api-client";

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
  url: string,
): Promise<TestUser> {
  const email = generateRandomEmail();
  const password = generateRandomPassword();
  const givenName = generateRandomName();

  const api = new Api({ baseURL: url });
  
  const response = await api.auth.authControllerRegister({
    email,
    password,
    givenName,
    familyName: "TestUser",
  });

  return {
    email,
    password,
    token: response.data.token,
  };
}

/**
 * Logs in an existing user and returns JWT token
 */
export async function loginTestUser(
  url: string,
  email: string,
  password: string,
): Promise<string> {
  const api = new Api({ baseURL: url });
  
  const response = await api.auth.authControllerLogin({
    email,
    password,
  });

  return response.data.token;
}