import { PartialType } from "@nestjs/swagger";

import { CreateFilterDto } from "./create-filter.dto";

export class UpdateFilterDto extends PartialType(CreateFilterDto) {}
