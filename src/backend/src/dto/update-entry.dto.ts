import { PartialType, OmitType } from "@nestjs/swagger";

import { CreateEntryDto } from "./create-entry.dto";

export class UpdateEntryDto extends PartialType(
  OmitType(CreateEntryDto, ["createdAt"] as const),
) {}
