import {
  Category,
  Transaction,
  User,
  Filter,
  FilterCategory,
} from "@prisma/client";

/**
 * Type-safe mock data factories.
 * These help avoid unsafe type assertions by providing properly typed mock data.
 */

export function createMockCategory(overrides?: Partial<Category>): Category {
  return {
    id: 1,
    name: "Test Category",
    color: "Blue",
    icon: "test-icon",
    userId: 1,
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockCategoryWithCount(
  overrides?: Partial<Category & { _count: { Transaction: number } }>,
): Category & { _count: { Transaction: number } } {
  return {
    ...createMockCategory(overrides),
    _count: {
      Transaction: 0,
      ...overrides?._count,
    },
  };
}

export function createMockTransaction(
  overrides?: Partial<Transaction>,
): Transaction {
  return {
    id: 1,
    type: "EXPENSE" as Transaction["type"],
    amount: 1000,
    description: "Test transaction",
    currency: "EUR" as Transaction["currency"],
    userId: 1,
    categoryId: null,
    createdAt: new Date(),
    isRecurring: false,
    recurringType: null,
    recurringBaseInterval: null,
    recurringDisabled: null,
    transactionId: null,
    ...overrides,
  };
}

export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 1,
    email: "test@example.com",
    passwordHash: "hashedPassword",
    givenName: "Test",
    familyName: "User",
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockFilter(
  overrides?: Partial<Filter & { filterCategories: FilterCategory[] }>,
): Filter & { filterCategories: FilterCategory[] } {
  return {
    id: 1,
    title: "Test Filter",
    icon: "test-icon",
    minPrice: 1000,
    maxPrice: 5000,
    dateFrom: null,
    dateTo: null,
    searchText: "test",
    transactionType: "EXPENSE" as Filter["transactionType"],
    sortOption: null,
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    filterCategories: [],
    ...overrides,
  };
}
