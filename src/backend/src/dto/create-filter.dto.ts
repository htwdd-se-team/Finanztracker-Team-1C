import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TransactionType, FilterSortOption } from "@prisma/client";
import { Type, Transform } from "class-transformer";
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

  @ApiPropertyOptional({ description: "Minimum amount" })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({ description: "Maximum amount" })
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
    isArray: true,
    type: Number,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Transform(({ value }): number[] | undefined => {
    // Keep undefined/null as undefined so @IsOptional() still works
    if (value == null || value === "") return undefined;
    if (typeof value === "string") {
      const parsed = value
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isInteger(n) && n > 0);
      return parsed.length ? Array.from(new Set(parsed)) : undefined;
    }
    const arr = Array.isArray(value) ? value : [value];
    const nums = arr
      .map((v) => Number(v))
      .filter((n) => Number.isInteger(n) && n > 0);
    return nums.length ? Array.from(new Set(nums)) : undefined;
  })
  categoryIds?: number[];
}
