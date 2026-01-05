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
  UseInterceptors,
  UploadedFiles,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiNotFoundResponse,
  ApiConsumes,
  ApiBody,
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
  ScheduledEntriesSummaryDto,
  ScheduledEntriesSummaryParamsDto,
  ScheduledMonthlyParamsDto,
  ScheduledMonthlyTotalsResponseDto,
  UpdateEntryDto,
} from "../dto";
import { JwtAuthGuard } from "../guards";
import {
  EntryService,
  ImportService,
  RecurringEntryService,
} from "../services";
import { entryImportFileFilter } from "../utils/file-filter.util";

@ApiTags("Entry")
@Controller("entries")
@ApiSecurity("user-jwt")
@UseGuards(JwtAuthGuard)
export class EntryController {
  constructor(
    private readonly entryService: EntryService,
    private readonly recurringEntryService: RecurringEntryService,
    private readonly importService: ImportService,
  ) {}

  /**
   * Create an entry
   */
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

  /**
   * Get all entries
   */
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

  /**
   * Delete an entry by id
   */
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

  /**
   * Update an entry by id
   */
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

  /**
   * Get all scheduled entries
   */
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

  /**
   * Get summary statistics for all scheduled entries
   */
  @Get("scheduled-entries/summary")
  @ApiOkResponse({
    type: ScheduledEntriesSummaryDto as Type<ScheduledEntriesSummaryDto>,
    description: "Scheduled entries summary fetched successfully",
  })
  async getScheduledEntriesSummary(
    @UserDecorator() user: User,
    @Query() { disabled }: ScheduledEntriesSummaryParamsDto,
  ): Promise<ScheduledEntriesSummaryDto> {
    return await this.recurringEntryService.getScheduledEntriesSummary(
      user.id,
      disabled,
    );
  }

  @Get("scheduled-entries/monthly-totals")
  @ApiOkResponse({
    type: ScheduledMonthlyTotalsResponseDto as Type<ScheduledMonthlyTotalsResponseDto>,
    description: "Monthly totals for scheduled (recurring) child transactions",
  })
  async getScheduledMonthlyTotals(
    @UserDecorator() user: User,
    @Query() params: ScheduledMonthlyParamsDto,
  ): Promise<ScheduledMonthlyTotalsResponseDto> {
    return await this.recurringEntryService.getScheduledMonthlyTotals(
      user.id,
      params?.year,
      params?.month,
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

  /**
   * Enable a scheduled entry by id
   */
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

  /**
   * Import entries from file (CSV, TXT, or XLSX)
   */
  @Post("import")
  @UseInterceptors(
    FilesInterceptor("files", 10, { fileFilter: entryImportFileFilter }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: {
            type: "file",
            format: "binary",
          },
          description:
            "Files to import. Allowed formats: TXT, CSV, XLSX, and other text files.",
        },
      },
    },
  })
  @ApiOkResponse({
    type: EntryResponseDto,
    isArray: true,
    description: "Files uploaded successfully",
  })
  @ApiBadRequestResponse({
    description: "Invalid file type or file validation failed",
  })
  async importEntries(
    @UserDecorator() user: User,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<EntryResponseDto[]> {
    return await this.importService.importEntries(user, files);
  }
}
