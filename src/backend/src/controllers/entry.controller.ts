import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiCreatedResponse,
  ApiBadRequestResponse,
} from "@nestjs/swagger";
import { CreateEntryDto, EntryResponseDto } from "src/dto";
import { EntryService } from "src/services/entry.service";

@ApiTags("entries")
@Controller("entries")
export class EntryController {
  constructor(private readonly entryService: EntryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    type: EntryResponseDto,
    description: "Entry created successfully",
  })
  @ApiBadRequestResponse({ description: "Invalid input data" })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  )
  async create(
    @Body() createEntryDto: CreateEntryDto,
  ): Promise<EntryResponseDto> {
    const entry = await this.entryService.createEntry(createEntryDto);
    return entry;
  }
}
