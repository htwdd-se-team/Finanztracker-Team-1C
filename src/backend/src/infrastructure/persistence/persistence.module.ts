import { Module } from "@nestjs/common";

import { CATEGORY_REPOSITORY } from "../../domain/repositories/category.repository.interface";
import { TRANSACTION_REPOSITORY } from "../../domain/repositories/transaction.repository.interface";
import { PrismaService } from "../../services/prisma.service";

import { CategoryMapper } from "./prisma/mappers/category.mapper";
import { TransactionMapper } from "./prisma/mappers/transaction.mapper";
import { PrismaCategoryRepository } from "./prisma/repositories/prisma-category.repository";
import { PrismaTransactionRepository } from "./prisma/repositories/prisma-transaction.repository";

/**
 * Persistence Module
 *
 * Registers all repository implementations and mappers for dependency injection.
 * This module connects the infrastructure implementations to the domain interfaces.
 */
@Module({
  providers: [
    PrismaService,

    // Mappers
    CategoryMapper,
    TransactionMapper,

    // Repositories
    {
      provide: CATEGORY_REPOSITORY,
      useClass: PrismaCategoryRepository,
    },
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: PrismaTransactionRepository,
    },
  ],
  exports: [CATEGORY_REPOSITORY, TRANSACTION_REPOSITORY, PrismaService],
})
export class PersistenceModule {}
