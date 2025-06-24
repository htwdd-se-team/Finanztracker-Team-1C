import { Controller, Post, Body, UseGuards, Get, Query } from "@nestjs/common";
import {
  ApiTags,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiSecurity,
} from "@nestjs/swagger";
import { User } from "@prisma/client";

import { UserDecorator } from "../decorators";
import {
  CreateEntryDto,
  EntryPageDto,
  EntryPaginationParamsDto,
  EntryResponseDto,
} from "../dto";
import { JwtAuthGuard } from "../guards";
import { EntryService } from "../services";

@ApiTags("entries")
@Controller("entries")
@ApiSecurity("user-jwt")
@UseGuards(JwtAuthGuard)
export class EntryController {
  constructor(private readonly entryService: EntryService) {}

  @Post("create")
  @ApiOkResponse({
    type: EntryResponseDto,
    description: "Entry created successfully",
  })
  @ApiBadRequestResponse({ description: "Invalid input data" })
  async create(
    @UserDecorator() user: User,
    @Body() createEntryDto: CreateEntryDto,
  ): Promise<EntryResponseDto> {
    const entry = await this.entryService.createEntry(user, createEntryDto);
    return entry;
  }

  @Get("list")
  @ApiOkResponse({
    type: EntryPageDto,
    description: "Entries fetched successfully",
  })
  @ApiBadRequestResponse({ description: "Invalid input data" })
  async list(
    @UserDecorator() user: User,
    @Query() paginationParams: EntryPaginationParamsDto,
  ): Promise<EntryPageDto> {
    return this.entryService.getEntries(user, paginationParams);
  }
}
