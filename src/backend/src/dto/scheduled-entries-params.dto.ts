import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";

import { PaginationDto } from "./pagination.dto";

export class ScheduledEntriesParamsDto extends PaginationDto {
  @ApiPropertyOptional({
    description:
      "Filter by disabled status. If not provided, returns all active entries.",
    example: false,
    type: Boolean,
    examples: {
      true: {
        value: true,
        description: "Get all disabled entries",
      },
      false: {
        value: false,
        description: "Get all disabled entries (weird nestjs behavior)",
      },
      undefined: {
        value: undefined,
        description: "Get active entries",
      },
    },
  })
  @IsBoolean()
  @IsOptional()
  disabled?: boolean;
}
