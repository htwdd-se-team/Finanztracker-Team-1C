import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";
import { TransformBooleanString } from "@/transformers";

export class ScheduledEntriesSummaryParamsDto {
  @ApiPropertyOptional({
    description:
      "Filter by disabled status. If not provided, returns all active entries.",
    example: "false",
    type: Boolean,
  })
  @IsBoolean()
  @IsOptional()
  @TransformBooleanString()
  disabled?: boolean;
}
