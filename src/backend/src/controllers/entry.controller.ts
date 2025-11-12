import {
  Controller,
  Post,
  Body,
  UseGuards,
  Delete,
  Patch,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Type,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiNotFoundResponse,
} from "@nestjs/swagger";
import { User } from "@prisma/client";

import { UserDecorator } from "../decorators";
import {
  CreateEntryDto,
  EntryPageDto,
  EntryPaginationParamsDto,
  EntryResponseDto,
  ScheduledEntriesParamsDto,
  ScheduledEntriesResponseDto,
  UpdateEntryDto,
} from "../dto";
import { JwtAuthGuard } from "../guards";
import { EntryService, RecurringEntryService } from "../services";

@ApiTags("Entry")
@Controller("entries")
@ApiSecurity("user-jwt")
@UseGuards(JwtAuthGuard)
export class EntryController {
  constructor(
    private readonly entryService: EntryService,
    private readonly recurringEntryService: RecurringEntryService,
  ) {}

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

  @Delete(":id")
  @ApiOkResponse({ description: "Entry deleted successfully" })
  @ApiNotFoundResponse({
    description: "Entry not found or not authorized to delete",
  })
  async delete(
    @UserDecorator() user: User,
    @Param("id", ParseIntPipe) entryId: number,
  ): Promise<void> {
    await this.entryService.deleteEntry(user, entryId);
  }

  @Patch(":id")
  @ApiOkResponse({
    type: EntryResponseDto,
    description: "Entry updated successfully",
  })
  @ApiNotFoundResponse({
    description: "Entry not found or not authorized to update",
  })
  @ApiBadRequestResponse({ description: "Invalid input data" })
  async update(
    @UserDecorator() user: User,
    @Param("id", ParseIntPipe) entryId: number,
    @Body() data: UpdateEntryDto,
  ): Promise<EntryResponseDto> {
    return this.entryService.updateEntry(user, entryId, data);
  }

  @Get("scheduled-entries/list")
  @ApiOkResponse({
    type: ScheduledEntriesResponseDto as Type<ScheduledEntriesResponseDto>,
    description: "Scheduled entries fetched successfully",
  })
  @ApiBadRequestResponse({ description: "Invalid input data" })
  async getScheduledEntries(
    @UserDecorator() user: User,
    @Query() params: ScheduledEntriesParamsDto,
  ): Promise<ScheduledEntriesResponseDto> {
    return await this.recurringEntryService.getScheduledEntries(
      user.id,
      params,
    );
  }
  @Patch("scheduled-entries/:id/disable")
  @ApiOkResponse({ description: "Scheduled entry disabled successfully" })
  @ApiNotFoundResponse({
    description: "Scheduled entry not found or not authorized to disable",
  })
  async disableScheduledEntry(
    @UserDecorator() user: User,
    @Param("id", ParseIntPipe) entryId: number,
  ): Promise<EntryResponseDto> {
    return await this.recurringEntryService.disableRecurringEntry(
      entryId,
      user.id,
    );
  }

  @Patch("scheduled-entries/:id/enable")
  @ApiOkResponse({ description: "Scheduled entry enabled successfully" })
  @ApiNotFoundResponse({
    description: "Scheduled entry not found or not authorized to enable",
  })
  async enableScheduledEntry(
    @UserDecorator() user: User,
    @Param("id", ParseIntPipe) entryId: number,
  ): Promise<EntryResponseDto> {
    return await this.recurringEntryService.enableRecurringEntry(
      entryId,
      user.id,
    );
  }
}
