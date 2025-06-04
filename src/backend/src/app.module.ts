import { Module } from '@nestjs/common';
import { dotenvLoader, TypedConfigModule } from 'nest-typed-config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BackendConfig } from './backend.config';
import { AuthController } from './controllers';
import { PrismaService, TestService } from './services';

@Module({
  imports: [
    TypedConfigModule.forRoot({
      isGlobal: true,
      load: dotenvLoader({
        separator: '.',
      }),
      schema: BackendConfig,
    }),
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, PrismaService, TestService],
})
export class AppModule {}
