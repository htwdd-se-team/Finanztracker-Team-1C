import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MulterModule } from "@nestjs/platform-express";
import { ScheduleModule } from "@nestjs/schedule";
import { memoryStorage } from "multer";
import { dotenvLoader, TypedConfigModule } from "nest-typed-config";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { BackendConfig } from "./backend.config";
import {
  AuthController,
  EntryController,
  UserController,
  CategoryController,
  AnalyticsController,
  FilterController,
} from "./controllers";
import { JwtAuthGuard } from "./guards";
import {
  AnalyticsService,
  AuthService,
  EntryService,
  FilterService,
  KyselyService,
  PrismaService,
  CategoryService,
  UserService,
  RecurringEntryService,
  ImportService,
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
  ],
  controllers: [
    AppController,
    AuthController,
    CategoryController,
    EntryController,
    FilterController,
    UserController,
    AnalyticsController,
  ],
  providers: [
    // services
    AppService,
    AnalyticsService,
    AuthService,
    EntryService,
    CategoryService,
    UserService,
    FilterService,
    RecurringEntryService,
    ImportService,
    // util services
    KyselyService,
    PrismaService,
    // guards
    JwtAuthGuard,
    // strategies
    JwtStrategy,
  ],
})
export class AppModule {}
