import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
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
} from "./controllers";
import { JwtAuthGuard } from "./guards";
import {
  AnalyticsService,
  AuthService,
  EntryService,
  KyselyService,
  PrismaService,
  CategoryService,
  UserService,
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
  ],
  controllers: [
    AppController,
    AuthController,
    CategoryController,
    EntryController,
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

    KyselyService,
    PrismaService,
    // guards
    JwtAuthGuard,
    // strategies
    JwtStrategy,
  ],
})
export class AppModule {}
