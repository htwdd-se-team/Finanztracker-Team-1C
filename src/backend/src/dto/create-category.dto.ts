import { OmitType } from "@nestjs/swagger";

import { CategoryResponseDto } from "./category-response.dto";

export class CreateCategoryDto extends OmitType(CategoryResponseDto, [
  "id",
  "createdAt",
  "usageCount",
]) {}
