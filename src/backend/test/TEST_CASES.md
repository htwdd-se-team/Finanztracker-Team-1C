# Test Cases Documentation

This document contains all test cases from `*.module-spec.ts` files in the test directory.

---

## entry.service.module-spec.ts

### EntryService

#### createEntry

- **should create a non-recurring entry successfully**
- **should create a recurring entry with parent and child**
- **should default currency to EUR if not provided**

#### getEntries

- **should get entries with pagination**
- **should filter entries by date range**
- **should filter entries by transaction type**
- **should filter entries by category IDs**
- **should exclude recurring parent entries**
- **should apply filter when filterId is provided**
- **should throw NotFoundException if filter not found**

#### updateEntry

- **should update entry successfully**
- **should throw NotFoundException if entry not found**
- **should throw BadRequestException when updating recurring properties on non-recurring entry**

#### deleteEntry

- **should delete non-recurring entry successfully**
- **should disable recurring parent entry instead of deleting**
- **should throw NotFoundException if entry not found**
- **should throw NotFoundException if entry belongs to different user**

#### getEntries - Advanced Filtering

- **should handle combined filters (date range + type + category + amount)**
- **should handle cursor pagination correctly**
- **should set cursorId to null when fewer entries than take**
- **should apply filter sortOption mapping correctly**
- **should handle all filter sort options**

#### getEntries - Sort Options

- **should sort by CREATED_AT_ASC**
- **should sort by AMOUNT_ASC**
- **should sort by AMOUNT_DESC**

#### createEntry - Recurring Edge Cases

- **should default recurringBaseInterval to 1 if not provided**
- **should use provided createdAt for recurring entry**
- **should default createdAt to now for child if not provided**

---

## filter.service.module-spec.ts

### FilterService

#### createFilter

- **should create filter successfully**
- **should create filter without category IDs**

#### getFilters

- **should return all filters for user**
- **should return empty array when no filters exist**
- **should include category IDs in response**

#### updateFilter

- **should update filter successfully**
- **should update category IDs**
- **should clear category IDs when empty array provided**
- **should throw NotFoundException if filter not found**

#### deleteFilter

- **should delete filter successfully**
- **should throw NotFoundException if filter not found**
- **should throw NotFoundException if filter belongs to different user**

#### createFilter - Edge Cases

- **should create filter with all optional fields**
- **should create filter with minimal required fields**

#### getFilters - Edge Cases

- **should return filters ordered by createdAt desc**

---

## analytics.service.module-spec.ts

### AnalyticsService

#### getTransactionBreakdown

- **should return transaction breakdown without categories**
- **should return transaction breakdown with categories**
- **should handle different granularities**

#### getTransactionBalanceHistory

- **should return balance history with cumulative balance**
- **should calculate initial balance before start date**
- **should handle empty results**

#### getMaxTransactionAmountForUser

- **should return maximum transaction amount rounded up**
- **should return 0 when no transactions exist**
- **should round up to nearest 100**
- **should handle exact multiples of 100**

#### getTransactionBreakdown - Granularity Tests

- **should handle DAY granularity**
- **should handle WEEK granularity**
- **should handle MONTH granularity**
- **should handle YEAR granularity**
- **should handle mixed transaction types in breakdown**

#### getTransactionBalanceHistory - Granularity Tests

- **should handle DAY granularity**
- **should handle WEEK granularity**
- **should handle MONTH granularity**
- **should handle YEAR granularity**
- **should handle cumulative balance calculation correctly**

---

## user.service.module-spec.ts

### UserService

#### getUser

- **should return user data without sensitive information**
- **should return null if user not found**

#### getBalance

- **should calculate balance correctly with income and expenses**
- **should return zero balance when no transactions exist**
- **should handle negative balance correctly**
- **should only count non-recurring transactions**
- **should handle large balance values**
- **should handle balance with only income transactions**
- **should handle balance with only expense transactions**
- **should exclude future-dated transactions**
- **should exclude child transactions (transactionId IS NULL)**

#### getUser - Edge Cases

- **should handle user without familyName**

---

## auth.service.module-spec.ts

### AuthService

#### generateJwtToken

- **should generate a JWT token for a user**

#### register

- **should successfully register a new user**
- **should throw HttpException if user already exists**
- **should register user without familyName if not provided**

#### checkUserExists

- **should return user if exists**
- **should return null if user does not exist**

#### validateUser

- **should return user if credentials are valid**
- **should throw HttpException if user not found**
- **should throw HttpException if password is invalid**

#### hashPassword

- **should hash a password**
- **should produce different hashes for the same password (due to salt)**

#### comparePasswords

- **should return true for matching passwords**
- **should return false for non-matching passwords**
- **should throw HttpException if password is empty**
- **should throw HttpException if hashedPassword is empty**
- **should handle very long passwords**
- **should handle special characters in passwords**
- **should handle unicode characters in passwords**

#### generateJwtToken - Edge Cases

- **should generate different tokens for different users**

---

## category.service.module-spec.ts

### CategoryService

#### createCategory

- **should create a category successfully**
- **should return usage count as 0 for new category**

#### updateCategory

- **should update category successfully**
- **should throw NotFoundException if category not found**
- **should throw NotFoundException if category belongs to different user**

#### deleteCategory

- **should delete category successfully**
- **should throw NotFoundException if category not found**

#### listCategories

- **should list categories with default sorting**
- **should sort by usage count descending**
- **should sort alphabetically ascending**
- **should return empty array when no categories exist**
- **should sort by CREATED_AT_ASC**
- **should sort by CREATED_AT_DESC**
- **should sort by ALPHA_DESC**
- **should default to CREATED_AT_DESC when sortBy is not provided**

#### createCategory - Edge Cases

- **should create category with all required fields**

#### updateCategory - Edge Cases

- **should update only provided fields**

---

## recurring-entry.service.module-spec.ts

### RecurringEntryService

#### getScheduledEntries

- **should return active scheduled entries**
- **should return disabled scheduled entries when disabled=true**
- **should handle pagination with cursor**
- **should set cursorId when entries match take limit**
- **should set cursorId to null when entries are less than take limit**

#### disableRecurringEntry

- **should disable a recurring entry**
- **should throw error if entry not found**
- **should throw error if entry belongs to different user**
- **should throw error if entry is not recurring**

#### enableRecurringEntry

- **should enable a disabled recurring entry**
- **should throw error if entry not found**

#### processRecurringEntries

- **should skip processing if RUN_SCHEDULED_ENTRIES is false**
- **should process active recurring entries**
- **should not create child if not enough time has passed**
- **should create child for daily recurring entry when enough time has passed**
- **should create child for weekly recurring entry when enough time has passed**
- **should handle monthly recurring entry with interval > 1**
- **should use parent createdAt when no child exists**
- **should skip disabled recurring entries**
- **should skip entry if parent is not found**

---

## app.module-spec.ts

### AppModule

- **should be defined**
- **should have AppController**
- **should have AppService**

#### AppController

- **should return "Hello World!"**

---

## Summary

### Total Test Cases by File

- **entry.service.module-spec.ts**: 27 test cases
- **filter.service.module-spec.ts**: 12 test cases
- **analytics.service.module-spec.ts**: 18 test cases
- **user.service.module-spec.ts**: 11 test cases
- **auth.service.module-spec.ts**: 18 test cases
- **category.service.module-spec.ts**: 15 test cases
- **recurring-entry.service.module-spec.ts**: 14 test cases
- **app.module-spec.ts**: 4 test cases

**Total: 119 test cases**
