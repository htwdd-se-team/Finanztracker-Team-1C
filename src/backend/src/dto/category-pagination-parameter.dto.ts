import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsEnum } from "class-validator";

import { CategorySortBy } from "../domain/repositories/category.repository.interface";

import { PaginationDto } from "./pagination.dto";

// Re-export for backwards compatibility
export { CategorySortBy } from "../domain/repositories/category.repository.interface";

export class CategoryPaginationParamsDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: CategorySortBy,
    enumName: "CategorySortBy",
    example: CategorySortBy.USAGE_DESC,
  })
  @IsOptional()
  @IsEnum(CategorySortBy)
  sortBy?: CategorySortBy;
}
