import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsInt, IsOptional, ValidateNested } from "class-validator";

import { EntryResponseDto } from "./entry-response.dto";

export class ScheduledEntriesResponseDto {
  @ApiProperty({
    description: "Scheduled entries (parent recurring transactions)",
    type: EntryResponseDto,
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntryResponseDto)
  entries: EntryResponseDto[];

  @ApiPropertyOptional({
    description: "Next cursor ID for pagination",
    example: 5,
  })
  @IsInt()
  @IsOptional()
  cursorId?: number;

  @ApiProperty({
    description: "Number of entries returned",
    example: 10,
  })
  @IsInt()
  count: number;
}
