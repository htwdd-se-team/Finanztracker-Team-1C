import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsBoolean,
  IsDateString,
} from "class-validator";

export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

export enum RecurringTransactionType {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}

export class CreateEntryDto {
  @IsEnum(TransactionType)
  @ApiProperty({
    enum: TransactionType,
    enumName: "TransactionType",
    example: TransactionType.EXPENSE,
  })
  type: TransactionType;

  @IsInt()
  @ApiProperty({
    description: "Amount in cents",
    example: 1999,
  })
  amount: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: "Optional description",
    example: "Grocery shopping",
  })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: "EUR",
  })
  currency?: string;

  @IsInt()
  @ApiProperty({
    description: "User ID",
    example: 1,
  })
  userId: number;

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({
    description: "Category ID",
    example: 3,
  })
  categoryId?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: "Marks transaction as recurring",
    example: false,
  })
  isRecurring?: boolean;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    description: "Start date for recurring transaction",
    example: "2025-01-01",
  })
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    description: "End date for recurring transaction",
    example: "2025-12-31",
  })
  endDate?: string;

  @IsOptional()
  @IsEnum(RecurringTransactionType)
  @ApiPropertyOptional({
    enum: RecurringTransactionType,
    enumName: "RecurringTransactionType",
    example: RecurringTransactionType.MONTHLY,
  })
  recurringType?: RecurringTransactionType;

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({
    description: "Interval between recurrences (e.g. every X days)",
    example: 1,
  })
  recurringInterval?: number;

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({
    description: "Parent transaction ID for recurring chain",
    example: null,
  })
  transactionId?: number;
}
