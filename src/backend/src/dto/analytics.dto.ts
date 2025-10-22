import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TransactionType } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  ValidateNested,
  IsArray,
} from "class-validator";

export enum Granularity {
  DAY = "DAY",
  WEEK = "WEEK",
  MONTH = "MONTH",
  YEAR = "YEAR",
}

export class TransactionBalanceHistoryParamsDto {
  @ApiProperty({
    description: "Start date for the analytics period (inclusive)",
    example: "2025-01-01",
    type: String,
  })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({
    description: "End date for the analytics period (inclusive)",
    example: "2025-02-28",
    type: String,
  })
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({
    description: "Granularity for grouping the data",
    enum: Granularity,
    enumName: "Granularity",
    example: Granularity.DAY,
  })
  @IsEnum(Granularity)
  granularity: Granularity;
}

export class TransactionBreakdownParamsDto extends TransactionBalanceHistoryParamsDto {
  @ApiPropertyOptional({
    description:
      "Whether to include category information in the response. If not provided, defaults to false.",
    example: true,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  withCategory?: boolean;
}

export class TransactionItemDto {
  @ApiProperty({
    description: "Date for this data point",
    example: "21-02-2025",
  })
  @IsString()
  @Type(() => Date)
  date: Date;

  @ApiProperty({
    description: "Transaction amount in cents",
    example: "2122",
  })
  @IsString()
  value: string;
}

export class TransactionBreakdownItemDto extends TransactionItemDto {
  @ApiProperty({
    description: "Transaction type (INCOME or EXPENSE)",
    enum: TransactionType,
    enumName: "TransactionType",
    example: TransactionType.EXPENSE,
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiPropertyOptional({
    description: "Category ID (only included if withCategory is true)",
    example: 12,
  })
  @IsOptional()
  @IsNumber()
  category?: number;
}

export class TransactionBreakdownResponseDto {
  @ApiProperty({
    description: "Array of transaction breakdown data",
    type: TransactionBreakdownItemDto,
    isArray: true,
  })
  @ValidateNested({ each: true })
  @Type(() => TransactionBreakdownItemDto)
  @IsArray()
  data: TransactionBreakdownItemDto[];
}

export class MaxValueDto {
  @ApiProperty({
    example: 1200,
    description: "Highest transaction value of user",
  })
  maxPrice!: number;
}
