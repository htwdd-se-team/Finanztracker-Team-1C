import { Module } from "@nestjs/common";
import { dotenvLoader, TypedConfigModule } from "nest-typed-config";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { BackendConfig } from "./backend.config";
import { AuthController, EntryController } from "./controllers";
import { PrismaService } from "./services";
import { EntryService } from "./services/entry.service";

@Module({
  imports: [
    TypedConfigModule.forRoot({
      isGlobal: true,
      load: dotenvLoader({
        separator: ".",
      }),
      schema: BackendConfig,
    }),
  ],
  controllers: [AppController, AuthController, EntryController],
  providers: [AppService, PrismaService, EntryService],
})
export class AppModule {}
