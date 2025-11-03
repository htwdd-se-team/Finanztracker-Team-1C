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
  Min,
} from "class-validator";

export class CreateFilterDto {
  @ApiProperty({ example: "Monthly groceries" })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: "Optional icon name" })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: "Minimum amount in cents" })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({ description: "Maximum amount in cents" })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional({ description: "Filter start date" })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateFrom?: Date;

  @ApiPropertyOptional({ description: "Filter end date" })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateTo?: Date;

  @ApiPropertyOptional({ description: "Search text" })
  @IsString()
  @IsOptional()
  searchText?: string;

  @ApiPropertyOptional({ enum: TransactionType, enumName: "TransactionType" })
  @IsEnum(TransactionType)
  @IsOptional()
  transactionType?: TransactionType;

  @ApiPropertyOptional({ enum: FilterSortOption, enumName: "FilterSortOption" })
  @IsEnum(FilterSortOption)
  @IsOptional()
  sortOption?: FilterSortOption = FilterSortOption.NEWEST_FIRST;

  @ApiPropertyOptional({
    description: "Category IDs to include",
    type: Number,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  categoryIds?: number[];
}
