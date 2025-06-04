import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';

import { AppModule } from './app.module';
import { BackendConfig } from './backend.config';

async function bootstrap() {
  const bootstrapLogger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  const { CORS_ORIGIN, PORT } = app.get(BackendConfig);

  if (CORS_ORIGIN) {
    app.enableCors({ origin: CORS_ORIGIN.split(',') });
  }

  const customOptions: SwaggerCustomOptions = {
    customSiteTitle: 'FinApp backend',
    swaggerOptions: {
      persistAuthorization: true,
    },
    customCss: `
    .swagger-ui .topbar { display: none }
    `,
  };

  const config = new DocumentBuilder()
    .setTitle('FinApp backend')
    .addSecurity('admin-auth', {
      in: 'header',
      name: 'admin-auth',
      scheme: 'admin-auth',
      type: 'apiKey',
    })
    .addBearerAuth(
      {
        name: 'Authorization',
        bearerFormat: 'JWT',
        type: 'http',
        in: 'header',
      },
      'user-jwt',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, customOptions);

  await app.listen(PORT);

  bootstrapLogger.log('Application listening:  ' + (await app.getUrl()));
  bootstrapLogger.log(`Swagger JSON:  ${await app.getUrl()}/api-json`);
  bootstrapLogger.log(`Swagger UI:  ${await app.getUrl()}/api`);
}

bootstrap();
