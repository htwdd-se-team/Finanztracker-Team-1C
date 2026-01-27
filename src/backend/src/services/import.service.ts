import { BadRequestException, Injectable } from "@nestjs/common";
import { TransactionType, User } from "@prisma/client";
import { DateTime } from "luxon";
import * as Papa from "papaparse";
import { CreateEntryDto, Currency, EntryResponseDto } from "@/dto";

import { EntryService } from "./entry.service";

@Injectable()
export class ImportService {
  constructor(private readonly entryService: EntryService) {}

  async importEntries(
    user: User,
    files: Express.Multer.File[],
  ): Promise<EntryResponseDto[]> {
    const transactions: CreateEntryDto[] = [];
    for (const file of files) {
      const parsedTransactions = this.parseFiles(file);
      // check for duplicates
      for (const transaction of parsedTransactions) {
        const duplicate = transactions.find(
          (t) =>
            t.amount === transaction.amount &&
            t.description === transaction.description &&
            t.createdAt === transaction.createdAt,
        );
        if (!duplicate) {
          transactions.push(transaction);
        }
      }
    }

    const entries: EntryResponseDto[] = [];

    for (const transaction of transactions) {
      if (await this.entryService.checkIfEntryExists(user, transaction)) {
        continue;
      }
      entries.push(await this.entryService.createEntry(user, transaction));
    }

    return entries;
  }

  private parseFiles(file: Express.Multer.File): CreateEntryDto[] {
    const parsed = Papa.parse(file.buffer.toString(), {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value) => value.trim(),
    });

    if (parsed.errors.length > 0) {
      throw new BadRequestException(parsed.errors[0].message);
    }

    const transactions: CreateEntryDto[] = parsed.data
      .map((row: Record<string, string | undefined>) => {
        if (
          !row ||
          Object.values(row).every(
            (value) => value === undefined || value === "",
          )
        ) {
          return null;
        }

        const day = row["Buchungstag"] ?? row["Buchungsdatum"];
        const amountUnparsed = row["Betrag"] ?? row["Betrag (€)"];
        const description_purpose = row["Verwendungszweck"];
        const description_receiver =
          row["Beguenstigter/Zahlungspflichtiger"] ??
          row["Name Zahlungsbeteiligter"];

        const description = [description_purpose, description_receiver]
          .filter(Boolean)
          .join(" - ")
          .replace(/ +/g, " ");

        // German format: comma is decimal separator, keep digits and comma, then convert comma to dot
        const amount = amountUnparsed.replace(/[^0-9,]/g, "").replace(",", ".");
        const type = amountUnparsed.startsWith("-")
          ? TransactionType.EXPENSE
          : TransactionType.INCOME;

        let currency: Currency = (row["Waehrung"] || Currency.EUR) as Currency;
        if (!Object.values(Currency).includes(currency)) {
          currency = Currency.EUR;
        }

        if (isNaN(Number(amount))) {
          throw new BadRequestException("Invalid amount");
        }

        if (!day) {
          throw new BadRequestException("Missing day");
        }

        // Parse German date format DD.MM.YYYY or DD.MM.YY using Luxon
        let dateTime = DateTime.fromFormat(day, "dd.MM.yyyy", {
          zone: "utc",
        });

        // If full year format failed, try two-digit year format
        if (!dateTime.isValid) {
          dateTime = DateTime.fromFormat(day, "dd.MM.yy", {
            zone: "utc",
          });
        }

        if (!dateTime.isValid) {
          throw new BadRequestException(
            `Invalid date format: ${day}. Expected DD.MM.YYYY or DD.MM.YY. ${dateTime.invalidReason || ""}`,
          );
        }

        return {
          amount: Math.round(Number(amount) * 100), // Convert to cents
          type,
          currency,
          description,
          createdAt: dateTime.toJSDate(),
        } satisfies CreateEntryDto;
      })
      .filter(Boolean);

    return transactions;
  }
}
