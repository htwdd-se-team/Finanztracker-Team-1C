import { OmitType } from "@nestjs/swagger";

import { EntryResponseDto } from "./entry-response.dto";

export class CreateEntryDto extends OmitType(EntryResponseDto, ["id"]) {}
