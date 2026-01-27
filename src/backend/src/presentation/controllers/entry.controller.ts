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
import {
  User,
  TransactionType as PrismaTransactionType,
  RecurringTransactionType as PrismaRecurringType,
} from "@prisma/client";

import { CheckTransactionDuplicateUseCase } from "../../application/use-cases/transactions/check-transaction-duplicate.use-case";
import { CreateTransactionUseCase } from "../../application/use-cases/transactions/create-transaction.use-case";
import { DeleteTransactionUseCase } from "../../application/use-cases/transactions/delete-transaction.use-case";
import { ListTransactionsUseCase } from "../../application/use-cases/transactions/list-transactions.use-case";
import { UpdateTransactionUseCase } from "../../application/use-cases/transactions/update-transaction.use-case";
import { UserDecorator } from "../../decorators";
import { Transaction } from "../../domain/entities/transaction.entity";
import { TransactionSortOption } from "../../domain/repositories/transaction.repository.interface";
import { RecurringType as DomainRecurringType } from "../../domain/value-objects/recurring-type.vo";
import { TransactionType as DomainTransactionType } from "../../domain/value-objects/transaction-type.vo";
import {
  CreateEntryDto,
  EntryPageDto,
  EntryPaginationParamsDto,
  EntryResponseDto,
  UpdateEntryDto,
  EntrySortBy,
  Currency,
  ScheduledEntriesParamsDto,
  ScheduledEntriesResponseDto,
  ScheduledEntriesSummaryDto,
  ScheduledMonthlyParamsDto,
  ScheduledMonthlyTotalsResponseDto,
} from "../../dto";
import { JwtAuthGuard } from "../../guards";
import { RecurringEntryService, ImportService } from "../../services";
import { entryImportFileFilter } from "../../utils/file-filter.util";

/**
 * Entry Controller (DDD Architecture)
 *
 * Presentation layer that handles HTTP requests for transactions/entries.
 * Delegates to use cases and transforms between DTOs and domain entities.
 *
 * NOTE: This is the NEW DDD-based controller that replaces the old EntryController
 */
@ApiTags("Entry")
@Controller("entries")
@ApiSecurity("user-jwt")
@UseGuards(JwtAuthGuard)
export class EntryDDDController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly updateTransactionUseCase: UpdateTransactionUseCase,
    private readonly deleteTransactionUseCase: DeleteTransactionUseCase,
    private readonly listTransactionsUseCase: ListTransactionsUseCase,
    private readonly checkDuplicateUseCase: CheckTransactionDuplicateUseCase,
    // Legacy services for recurring and import (to be migrated later)
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
    @Body() dto: CreateEntryDto,
  ): Promise<EntryResponseDto> {
    const result = await this.createTransactionUseCase.execute({
      amount: dto.amount,
      currency: dto.currency,
      description: dto.description,
      type: this.prismaTypeToDomainType(dto.type),
      categoryId: dto.categoryId,
      userId: user.id,
      createdAt: dto.createdAt,
      isRecurring: dto.isRecurring,
      recurringType: dto.recurringType
        ? this.prismaRecurringToDomainRecurring(dto.recurringType)
        : undefined,
      recurringBaseInterval: dto.recurringBaseInterval,
    });

    // Return the child transaction if it exists, otherwise the parent
    const transaction = result.child || result.parent;
    return this.mapToResponseDto(transaction);
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
    @Query() params: EntryPaginationParamsDto,
  ): Promise<EntryPageDto> {
    const page = await this.listTransactionsUseCase.execute({
      userId: user.id,
      filter: {
        minPrice: params.amountMin,
        maxPrice: params.amountMax,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        searchText: params.title,
        transactionType: params.transactionType
          ? this.prismaTypeToDomainType(params.transactionType)
          : undefined,
        categoryIds: params.categoryIds,
        sortOption: this.mapSortOption(params.sortBy),
        limit: params.take,
        offset: params.cursorId,
      },
    });

    const entries = page.items.map((t) => this.mapToResponseDto(t));

    return {
      entries,
      count: page.totalCount,
      cursorId: entries.length > 0 ? entries[entries.length - 1].id : undefined,
    };
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
    await this.deleteTransactionUseCase.execute({
      transactionId: entryId,
      userId: user.id,
    });
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
    @Body() dto: UpdateEntryDto,
  ): Promise<EntryResponseDto> {
    const transaction = await this.updateTransactionUseCase.execute({
      transactionId: entryId,
      userId: user.id,
      amount: dto.amount,
      currency: dto.currency,
      description: dto.description,
      type: dto.type ? this.prismaTypeToDomainType(dto.type) : undefined,
      categoryId: dto.categoryId,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
    });

    return this.mapToResponseDto(transaction);
  }

  /**
   * Get all scheduled entries (recurring parent transactions)
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
  ): Promise<ScheduledEntriesSummaryDto> {
    return await this.recurringEntryService.getScheduledEntriesSummary(user.id);
  }

  /**
   * Get monthly totals for scheduled entries
   */
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

  /**
   * Disable a scheduled entry by id
   */
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

  /**
   * Map domain entity to response DTO
   */
  private mapToResponseDto(transaction: Transaction): EntryResponseDto {
    return {
      id: transaction.id,
      type: this.domainTypeToPrismaType(transaction.type),
      amount: transaction.money.amount,
      description: transaction.description || undefined,
      currency: transaction.money.currency as Currency,
      createdAt: transaction.createdAt,
      categoryId: transaction.categoryId || undefined,
      isRecurring: transaction.isRecurring,
      recurringType: transaction.recurringType
        ? this.domainRecurringToPrismaRecurring(transaction.recurringType)
        : undefined,
      recurringBaseInterval: transaction.recurringBaseInterval || undefined,
      recurringDisabled: transaction.recurringDisabled,
      transactionId: transaction.parentTransactionId || undefined,
    };
  }

  /**
   * Map DTO sort option to domain sort option
   */
  private mapSortOption(
    sortBy?: EntrySortBy,
  ): TransactionSortOption | undefined {
    switch (sortBy) {
      case EntrySortBy.AMOUNT_DESC:
        return TransactionSortOption.HIGHEST_AMOUNT;
      case EntrySortBy.AMOUNT_ASC:
        return TransactionSortOption.LOWEST_AMOUNT;
      case EntrySortBy.CREATED_AT_DESC:
        return TransactionSortOption.NEWEST_FIRST;
      case EntrySortBy.CREATED_AT_ASC:
        return TransactionSortOption.OLDEST_FIRST;
      default:
        return undefined;
    }
  }

  /**
   * Convert Prisma TransactionType to Domain TransactionType
   */
  private prismaTypeToDomainType(
    prismaType: PrismaTransactionType,
  ): DomainTransactionType {
    return prismaType as unknown as DomainTransactionType;
  }

  /**
   * Convert Domain TransactionType to Prisma TransactionType
   */
  private domainTypeToPrismaType(
    domainType: DomainTransactionType,
  ): PrismaTransactionType {
    return domainType as unknown as PrismaTransactionType;
  }

  /**
   * Convert Prisma RecurringTransactionType to Domain RecurringType
   */
  private prismaRecurringToDomainRecurring(
    prismaType: PrismaRecurringType,
  ): DomainRecurringType {
    return prismaType as unknown as DomainRecurringType;
  }

  /**
   * Convert Domain RecurringType to Prisma RecurringTransactionType
   */
  private domainRecurringToPrismaRecurring(
    domainType: DomainRecurringType,
  ): PrismaRecurringType {
    return domainType as unknown as PrismaRecurringType;
  }
}
