import { ApiPropertyOptional, OmitType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsOptional } from "class-validator";

import { IsRecurringDateValid } from "../decorators/recurring-date-validator";

import { EntryResponseDto } from "./entry-response.dto";

/**
 * Create entry DTO
 */
export class CreateEntryDto extends OmitType(EntryResponseDto, [
  "id",
  "createdAt",
  "transactionId",
  "recurringDisabled",
]) {
  /**
   * Creation timestamp. If not provided, defaults to the current date and time.
   * For recurring entries, the creation date cannot be more than 30 days in the past.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @IsRecurringDateValid()
  @Type(() => Date)
  createdAt?: Date;
}
