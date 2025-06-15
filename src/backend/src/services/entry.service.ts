import { Injectable, InternalServerErrorException } from "@nestjs/common";
import {
  type CreateEntryDto,
  type EntryResponseDto,
  RecurringTransactionType,
  TransactionType,
} from "src/dto";

import { PrismaService } from "./prisma.service";

@Injectable()
export class EntryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new transaction entry in the database.
   * @param data - The data for the new entry (from DTO)
   * @returns The created entry mapped to EntryResponseDto
   */

  async createEntry(data: CreateEntryDto): Promise<EntryResponseDto> {
    try {
      // Insert transaction entry into database
      const entry = await this.prisma.transaction.create({
        data: {
          type: data.type,
          amount: data.amount,
          description: data.description,
          currency: data.currency || "EUR",
          userId: data.userId,
          isRecurring: data.isRecurring ?? false,
          recurringInterval: data.recurringInterval,
          categoryId: data.categoryId,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          transactionId: data.transactionId,
          recurringType: data.recurringType,
        },
      });

      // Helper function to map Prisma transaction type to DTO enum
      const mapTransactionType = (type: string | null): TransactionType => {
        switch (type) {
          case "INCOME":
            return TransactionType.INCOME;
          case "EXPENSE":
            return TransactionType.EXPENSE;
          default:
            return TransactionType.EXPENSE;
        }
      };

      // Helper function to map Prisma recurring type from DB to RecurringTransactionType enum
      const mapRecurringType = (
        type: string | null,
      ): RecurringTransactionType | undefined => {
        switch (type) {
          case "DAILY":
            return RecurringTransactionType.DAILY;
          case "WEEKLY":
            return RecurringTransactionType.WEEKLY;
          case "MONTHLY":
            return RecurringTransactionType.MONTHLY;
          case "YEARLY":
            return RecurringTransactionType.YEARLY;
          default:
            return undefined;
        }
      };

      // Transform Prisma transaction result to the EntryResponse DTO
      const response: EntryResponseDto = {
        id: entry.id,
        type: mapTransactionType(entry.type),
        amount: entry.amount,
        description: entry.description || undefined,
        currency: entry.currency,
        createdAt: entry.createdAt,
        userId: entry.userId,
        categoryId: entry.categoryId || undefined,
        isRecurring: entry.isRecurring,
        startDate: entry.startDate || undefined,
        endDate: entry.endDate || undefined,
        recurringType: mapRecurringType(entry.recurringType),
        recurringInterval: entry.recurringInterval || undefined,
        transactionId: entry.transactionId || undefined,
      };

      return response;
    } catch (error: unknown) {
      let errorMessage = "Failed to create entry: Unknown error";

      if (error instanceof Error) {
        errorMessage = `Failed to create entry: ${error.message}`;
      } else if (typeof error === "string") {
        errorMessage = `Failed to create entry: ${error}`;
      } else if (error && typeof error === "object" && "message" in error) {
        errorMessage = `Failed to create entry: ${error.message}`;
      }

      throw new InternalServerErrorException(errorMessage);
    }
  }
}
