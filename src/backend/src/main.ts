import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from "@nestjs/swagger";

import { AppModule } from "./app.module";
import { BackendConfig } from "./backend.config";

async function bootstrap() {
  const bootstrapLogger = new Logger("Bootstrap");

  const app = await NestFactory.create(AppModule);
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
  const { CORS_ORIGIN, PORT } = app.get(BackendConfig);

  if (CORS_ORIGIN) {
    const allowedOrigins = CORS_ORIGIN.split(",").map((origin) =>
      origin.trim(),
    );

    app.enableCors({
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        const isAllowed = allowedOrigins.some((allowedOrigin) => {
          // Handle wildcards
          if (allowedOrigin.includes("*")) {
            // Escape special regex characters except for *
            const escapedOrigin = allowedOrigin.replace(
              /[.+?^${}()|[\]\\]/g,
              "\\$&",
            );
            // Replace * with .* for wildcard matching
            const regexPattern = "^" + escapedOrigin.replace(/\*/g, ".*") + "$";
            const regex = new RegExp(regexPattern);
            return regex.test(origin);
          }
          // Exact match
          return allowedOrigin === origin;
        });

        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
    });
  }

  const customOptions: SwaggerCustomOptions = {
    customSiteTitle: "FinApp backend",
    swaggerOptions: {
      persistAuthorization: true,
    },
    customCss: `
    .swagger-ui .topbar { display: none }
    `,
  };

  const config = new DocumentBuilder()
    .setTitle("FinApp backend")
    .addSecurity("admin-auth", {
      in: "header",
      name: "admin-auth",
      scheme: "admin-auth",
      type: "apiKey",
    })
    .addBearerAuth(
      {
        name: "Authorization",
        bearerFormat: "JWT",
        type: "http",
        in: "header",
      },
      "user-jwt",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document, customOptions);

  await app.listen(PORT);

  bootstrapLogger.log("Application listening:  " + (await app.getUrl()));
  bootstrapLogger.log(`Swagger JSON:  ${await app.getUrl()}/api-json`);
  bootstrapLogger.log(`Swagger UI:  ${await app.getUrl()}/api`);
}

bootstrap().catch((err) => {
  // Ensure unhandled bootstrap errors are logged and process exits with failure
  // This also satisfies the linter rule against floating promises.
  console.error(err);
  process.exit(1);
});
