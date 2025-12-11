import { PrismaClient } from "@prisma/client";

/**
 * Creates a properly typed mock PrismaService.
 *
 * This factory creates a mock that matches the structure of PrismaClient
 * while allowing partial implementation. The returned object can be used
 * directly in NestJS TestingModule providers with `useValue`.
 *
 * @example
 * ```typescript
 * const mockPrisma = createMockPrismaService();
 * mockPrisma.transaction.findMany.mockResolvedValue([...]);
 *
 * const module = await createTestModule({
 *   providers: [
 *     MyService,
 *     { provide: PrismaService, useValue: mockPrisma },
 *   ],
 * });
 * ```
 */
export function createMockPrismaService(): jest.Mocked<
  Pick<PrismaClient, "transaction" | "category" | "filter" | "user">
> {
  return {
    transaction: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
    } as jest.Mocked<PrismaClient["transaction"]>,
    category: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    } as jest.Mocked<PrismaClient["category"]>,
    filter: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    } as jest.Mocked<PrismaClient["filter"]>,
    user: {
      findUnique: jest.fn(),
    } as jest.Mocked<PrismaClient["user"]>,
  };
}
