import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional } from "class-validator";

export class FilterParamsDto {
  @ApiPropertyOptional({
    description: "Filter ID",
    example: 1,
  })
  @IsOptional()
  @IsInt()
  filterId?: number;
}
