import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsOptional,
  IsString,
  IsDate,
  IsPositive,
  Allow,
} from "class-validator";

export class CategoryResponseDto {
  @ApiProperty({
    description: "Category ID",
    example: 1,
  })
  @IsInt()
  @IsPositive()
  id: number;

  @ApiProperty({
    description: "Category name",
    example: "Lebensmittel",
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "Category color string",
    example: "Blue",
  })
  @IsString()
  color: string;

  @ApiProperty({
    description: "Category icon name",
    example: "shopping-cart",
  })
  @IsString()
  icon: string;

  @ApiProperty({
    description: "Creation timestamp",
    example: new Date().toISOString(),
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiPropertyOptional({
    description: "Usage count of this category",
    example: 12,
  })
  @IsOptional()
  @Allow()
  usageCount?: number;
}
