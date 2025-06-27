import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsEnum } from "class-validator";

import { PaginationDto } from "./pagination.dto";

export enum CategorySortBy {
  USAGE_DESC = "usage_desc",
  CREATED_AT_DESC = "createdAt_desc",
  CREATED_AT_ASC = "createdAt_asc",
  ALPHA_ASC = "alpha_asc",
  ALPHA_DESC = "alpha_desc",
}

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
