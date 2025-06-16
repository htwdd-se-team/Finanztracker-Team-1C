import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TransactionType, RecurringTransactionType } from "@prisma/client";
import { Type } from "class-transformer";
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

  @ApiPropertyOptional({
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiPropertyOptional({
    description: "Start date for recurring transactions",
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({
    description: "End date for recurring transactions",
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({
    enum: RecurringTransactionType,
    enumName: "RecurringTransactionType",
    example: RecurringTransactionType.MONTHLY,
  })
  @IsEnum(RecurringTransactionType)
  @IsOptional()
  recurringType?: RecurringTransactionType;

  @ApiPropertyOptional({
    description: "Recurring interval",
    example: 1,
  })
  @IsInt()
  @IsOptional()
  recurringInterval?: number;

  @ApiPropertyOptional({
    description: "Parent transaction ID",
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
  })
  @IsEnum(EntrySortBy)
  @IsOptional()
  sortBy?: EntrySortBy;
}

export class EntryPageDto {
  @ApiProperty({
    description: "Entries",
    type: [EntryResponseDto],
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
