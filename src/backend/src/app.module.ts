import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MulterModule } from "@nestjs/platform-express";
import { ScheduleModule } from "@nestjs/schedule";
import { memoryStorage } from "multer";
import { dotenvLoader, TypedConfigModule } from "nest-typed-config";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CategoriesUseCasesModule } from "./application/use-cases/categories/categories-use-cases.module";
import { TransactionsUseCasesModule } from "./application/use-cases/transactions/transactions-use-cases.module";
import { BackendConfig } from "./backend.config";
import {
  AuthController,
  UserController,
  AnalyticsController,
  FilterController,
  DemoController,
} from "./controllers";
import { JwtAuthGuard } from "./guards";
import { PersistenceModule } from "./infrastructure/persistence/persistence.module";
import { CategoryDDDController } from "./presentation/controllers/category.controller";
import { EntryDDDController } from "./presentation/controllers/entry.controller";
import {
  AnalyticsService,
  AuthService,
  EntryService,
  FilterService,
  KyselyService,
  UserService,
  RecurringEntryService,
  ImportService,
  DemoService,
} from "./services";
import { JwtStrategy } from "./strategies";

@Module({
  imports: [
    TypedConfigModule.forRoot({
      isGlobal: true,
      load: dotenvLoader({ separator: "." }),
      schema: BackendConfig,
    }),
    JwtModule.registerAsync({
      inject: [BackendConfig],
      imports: [TypedConfigModule],
      useFactory: (config: BackendConfig) => ({
        secret: config.JWT_SECRET,
        signOptions: { expiresIn: config.JWT_EXPIRATION },
      }),
    }),
    ScheduleModule.forRoot(),
    MulterModule.register({
      dest: undefined,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- multer is not typed
      storage: memoryStorage(),
    }),
    // DDD Modules
    PersistenceModule, // Provides PrismaService to legacy services
    CategoriesUseCasesModule,
    TransactionsUseCasesModule,
  ],
  controllers: [
    AppController,
    AuthController,
    CategoryDDDController, // NEW: DDD-based controller
    DemoController,
    EntryDDDController, // NEW: DDD-based controller replaces EntryController
    FilterController,
    UserController,
    AnalyticsController,
  ],
  providers: [
    // services
    AppService,
    AnalyticsService,
    AuthService,
    DemoService,
    EntryService, // Still needed by ImportService and RecurringEntryService
    // CategoryService, // REMOVED: Replaced by CategoryDDDController + Use Cases
    UserService,
    FilterService,
    RecurringEntryService, // Used by EntryDDDController for recurring features
    ImportService, // Used by EntryDDDController for import features
    // util services
    KyselyService,
    // PrismaService is now provided by PersistenceModule, no need to register here
    // guards
    JwtAuthGuard,
    // strategies
    JwtStrategy,
  ],
})
export class AppModule {}
