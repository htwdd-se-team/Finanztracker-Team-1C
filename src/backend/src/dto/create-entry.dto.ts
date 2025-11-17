import { ApiPropertyOptional, OmitType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsOptional } from "class-validator";

import { EntryResponseDto } from "./entry-response.dto";

export class CreateEntryDto extends OmitType(EntryResponseDto, [
  "id",
  "createdAt",
  "transactionId",
  "recurringDisabled",
]) {
  @ApiPropertyOptional({
    description:
      "Creation timestamp. If not provided, defaults to the current date and time.",
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdAt?: Date;
}
