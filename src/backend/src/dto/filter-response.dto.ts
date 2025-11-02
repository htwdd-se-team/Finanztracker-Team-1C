import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TransactionType, FilterSortOption } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from "class-validator";

export class FilterResponseDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ example: "Monthly groceries" })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: "Minimum amount" })
  @IsInt()
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ description: "Maximum amount" })
  @IsInt()
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateFrom?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateTo?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  searchText?: string;

  @ApiPropertyOptional({ enum: TransactionType, enumName: "TransactionType" })
  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  @ApiPropertyOptional({ enum: FilterSortOption, enumName: "FilterSortOption" })
  @IsOptional()
  @IsEnum(FilterSortOption)
  sortOption?: FilterSortOption;

  @ApiPropertyOptional({ isArray: true, type: Number })
  @IsArray()
  @IsOptional()
  categoryIds?: number[];

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  userId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  updatedAt?: Date;
}
