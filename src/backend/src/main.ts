import * as path from "path";

import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from "@nestjs/swagger";
import { SpelunkerModule } from "nestjs-spelunker";

import { AppModule } from "./app.module";
import { BackendConfig } from "./backend.config";
import { generatePlantUMLFromSpelunker } from "./utils/generate-plantuml";

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
  const { CORS_ORIGIN, PORT, GEN_DOCS } = app.get(BackendConfig);

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

  if (GEN_DOCS) {
    const spelunker = SpelunkerModule.explore(app, {
      ignoreImports: [/^DiscoveryModule/i],
    });

    // Generate PlantUML diagram
    const outputPath = path.join(
      __dirname,
      "../../../docs/development/plantuml/nestjs-modules.puml",
    );
    const mermaidPath = path.join(
      __dirname,
      "../../../docs/development/plantuml/backend_classes.mermaid",
    );
    generatePlantUMLFromSpelunker(spelunker, outputPath, mermaidPath);
    bootstrapLogger.log(`PlantUML diagram generated: ${outputPath}`);

    // Also log JSON for debugging
    console.log(JSON.stringify(spelunker, null, 2));
  }

  await app.listen(PORT);

  bootstrapLogger.log("Application listening:  " + (await app.getUrl()));
  bootstrapLogger.log(`Swagger JSON:  ${await app.getUrl()}/api-json`);
  bootstrapLogger.log(`Swagger UI:  ${await app.getUrl()}/api`);
}

bootstrap().catch((error) => {
  console.error("Error starting application:", error);
  process.exit(1);
});
