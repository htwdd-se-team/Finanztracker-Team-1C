import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { TransactionType, RecurringTransactionType } from "./create-entry.dto";

export class EntryResponseDto {
  @ApiProperty({
    description: "Transaction ID",
    example: 1,
  })
  id: number;

  @ApiProperty({
    enum: TransactionType,
    enumName: "TransactionType",
    example: TransactionType.EXPENSE,
  })
  type: TransactionType;

  @ApiProperty({
    description: "Amount in cents",
    example: 1999,
  })
  amount: number;

  @ApiPropertyOptional({
    description: "Transaction description",
    example: "Grocery shopping",
  })
  description?: string;

  @ApiProperty({
    example: "EUR",
  })
  currency: string;

  @ApiProperty({
    description: "Creation timestamp",
    example: "2025-01-09T21:04:12.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "User ID",
    example: 1,
  })
  userId: number;

  @ApiPropertyOptional({
    description: "Category ID",
    example: 3,
  })
  categoryId?: number;

  @ApiProperty({
    example: false,
  })
  isRecurring: boolean;

  @ApiPropertyOptional({
    description: "Start date for recurring transactions",
    example: "2025-01-01",
  })
  startDate?: Date;

  @ApiPropertyOptional({
    description: "End date for recurring transactions",
    example: "2025-12-31",
  })
  endDate?: Date;

  @ApiPropertyOptional({
    enum: RecurringTransactionType,
    enumName: "RecurringTransactionType",
    example: RecurringTransactionType.MONTHLY,
  })
  recurringType?: RecurringTransactionType;

  @ApiPropertyOptional({
    description: "Recurring interval",
    example: 1,
  })
  recurringInterval?: number;

  @ApiPropertyOptional({
    description: "Parent transaction ID",
    example: null,
  })
  transactionId?: number;
}
