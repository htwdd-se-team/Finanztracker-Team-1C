import {
  Global,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";

import { BackendConfig } from "../backend.config";

@Global()
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  logger = new Logger(PrismaService.name);

  constructor(public config: BackendConfig) {
    const prismaOptions: Prisma.PrismaClientOptions = {
      ...{ datasources: { db: { url: config.DATABASE_URL } } },
    };

    super(prismaOptions);

    this.logger.log(
      `Connecting to Prisma at ${prismaOptions.datasources?.db?.url}`,
    );
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
