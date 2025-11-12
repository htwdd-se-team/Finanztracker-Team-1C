import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TransactionType, RecurringTransactionType } from "@prisma/client";
import { Type, Transform } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
  Min,
} from "class-validator";

import { Currency } from "./currencies.dto";
import { PaginationDto } from "./pagination.dto";

export class EntryResponseDto {
  @ApiProperty({
    description: "Transaction ID",
    example: 1,
  })
  @IsInt()
  @IsPositive()
  id: number;

  @ApiProperty({
    enum: TransactionType,
    enumName: "TransactionType",
    example: TransactionType.EXPENSE,
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    description: "Amount in cents",
    example: 1999,
  })
  @IsInt()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({
    description: "Transaction description",
    example: "Grocery shopping",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: Currency,
    enumName: "Currency",
    example: Currency.EUR,
    description: "ISO 4217 currency code",
  })
  @IsEnum(Currency)
  currency: Currency;

  @ApiProperty({
    description: "Creation timestamp",
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiPropertyOptional({
    description: "Category ID",
    example: 3,
  })
  @IsInt()
  @IsOptional()
  categoryId?: number;

  /**
   * recurring entry properties
   */

  @ApiPropertyOptional({
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiPropertyOptional({
    enum: RecurringTransactionType,
    enumName: "RecurringTransactionType",
    example: RecurringTransactionType.MONTHLY,
  })
  @IsEnum(RecurringTransactionType)
  @IsOptional()
  recurringType?: RecurringTransactionType;

  @ApiPropertyOptional({
    description: "Base recurring interval (1x Monthly, 2x Monthly, etc.)",
    example: 1,
  })
  @IsInt()
  @IsOptional()
  recurringBaseInterval?: number;

  @ApiPropertyOptional({
    description: "Whether the recurring entry is disabled",
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  recurringDisabled?: boolean;

  @ApiPropertyOptional({
    description: "Parent transaction ID (null if not a child)",
    example: null,
  })
  @IsInt()
  @IsOptional()
  transactionId?: number;
}

export enum EntrySortBy {
  CREATED_AT_ASC = "createdAt_asc",
  CREATED_AT_DESC = "createdAt_desc",
  AMOUNT_ASC = "amount_asc",
  AMOUNT_DESC = "amount_desc",
}

export class EntryPaginationParamsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: "Sort by",
    example: EntrySortBy.CREATED_AT_DESC,
    enum: EntrySortBy,
    enumName: "EntrySortBy",
    default: EntrySortBy.CREATED_AT_DESC,
  })
  @IsEnum(EntrySortBy)
  @IsOptional()
  @Transform(({ value }): EntrySortBy => value || EntrySortBy.CREATED_AT_DESC)
  sortBy?: EntrySortBy;

  @ApiPropertyOptional({
    description: "Filter by date range - from date (inclusive)",
    example: "2024-01-01",
    type: String,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateFrom?: Date;

  @ApiPropertyOptional({
    description: "Filter by date range - to date (inclusive)",
    example: "2024-12-31",
    type: String,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateTo?: Date;

  @ApiPropertyOptional({
    description: "Filter by transaction type",
    enum: TransactionType,
    enumName: "TransactionType",
    example: TransactionType.EXPENSE,
  })
  @IsEnum(TransactionType)
  @IsOptional()
  transactionType?: TransactionType;

  @ApiPropertyOptional({
    description:
      "Filter by categories (multi-select). Can be provided as comma-separated values or multiple query parameters.",
    example: [1, 2, 3],
    type: Number,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  @Transform(({ value }): number[] => {
    if (typeof value === "string") {
      // If the input is a string, split it by commas to handle comma-separated values,
      // then trim whitespace from each value, parse it as an integer, and filter out invalid numbers (NaN).
      return value
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));
    }
    // If the input is already an array, convert each element to a number.
    // If it's a single value, wrap it in an array after converting it to a number.
    return Array.isArray(value) ? value.map((v) => Number(v)) : [Number(value)];
  })
  categoryIds?: number[];

  @ApiPropertyOptional({
    description: "Filter by minimum amount (in cents)",
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  amountMin?: number;

  @ApiPropertyOptional({
    description: "Filter by maximum amount (in cents)",
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  amountMax?: number;

  @ApiPropertyOptional({
    description: "Search in transaction title/description",
    example: "grocery",
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: "Filter ID",
    example: 1,
  })
  @IsOptional()
  @IsInt()
  filterId?: number;
}

export class EntryPageDto {
  @ApiProperty({
    description: "Entries",
    type: EntryResponseDto,
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntryResponseDto)
  entries: EntryResponseDto[];

  @ApiPropertyOptional({
    description: "Next cursor ID",
    example: 2,
  })
  @IsInt()
  @IsOptional()
  cursorId?: number;

  @ApiPropertyOptional({
    description: "Total count of entries",
    example: 100,
  })
  @IsInt()
  @IsOptional()
  count?: number;
}
