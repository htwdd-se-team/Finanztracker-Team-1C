import { ModuleMetadata } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { TypedConfigModule } from "nest-typed-config";

import { BackendConfig } from "../src/backend.config";

/**
 * Creates a testing module with BackendConfig properly configured for tests.
 * Uses environment variables directly from process.env (no .env file needed).
 */
export async function createTestModule(
  moduleMetadata: ModuleMetadata,
): Promise<TestingModule> {
  return Test.createTestingModule({
    ...moduleMetadata,
    imports: [
      TypedConfigModule.forRoot({
        isGlobal: true,
        load: () => process.env as Record<string, string>,
        schema: BackendConfig,
      }),
      ...(moduleMetadata.imports || []),
    ],
  }).compile();
}
