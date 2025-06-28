import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { sql } from "kysely";

import { UserBalanceResponseDto, UserResponseDto } from "../dto";

import { KyselyService } from "./kysely.service";
import { PrismaService } from "./prisma.service";

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kysely: KyselyService,
  ) {}

  async getUser(user: User): Promise<UserResponseDto> {
    return await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        givenName: true,
        familyName: true,
        email: true,
        createdAt: true,
      },
    });
  }

  async getBalance(user: User): Promise<UserBalanceResponseDto> {
    const result = await this.kysely
      .selectFrom("Transaction")
      .where("userId", "=", user.id)
      .where("createdAt", "<=", sql<Date>`NOW()`)
      .select((eb) => [
        eb
          .fn("sum", [
            eb
              .case()
              .when("type", "=", "INCOME")
              .then(eb.ref("amount"))
              .when("type", "=", "EXPENSE")
              .then(eb.neg(eb.ref("amount")))
              .else(0)
              .end(),
          ])
          .as("balance"),
        eb.fn.count<string>("id").as("transaction_count"),
      ])
      .executeTakeFirst();

    return {
      balance: parseInt(result?.balance as string) || 0,
      transactionCount: parseInt(result?.transaction_count) || 0,
    };
  }
}
