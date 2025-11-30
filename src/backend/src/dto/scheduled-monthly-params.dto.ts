import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Min, Max } from "class-validator";

export class ScheduledMonthlyParamsDto {
  @ApiPropertyOptional({
    description:
      "Year to aggregate monthly totals for (defaults to current year)",
    example: 2025,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1970)
  year?: number;

  @ApiPropertyOptional({
    description:
      "Optional month to filter (1-12). If provided, only that month's totals are returned",
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}
