import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { App } from "supertest/types";

import { AppModule } from "../../src/app.module";

export async function createTestApp(): Promise<{
  app: INestApplication<App>;
  url: string;
}> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  //From apps main.ts
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  );

  await app.init();
  await app.listen(0);
  const url = await app.getUrl();

  return { app, url };
}
