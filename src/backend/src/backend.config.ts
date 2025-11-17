import { Type } from "class-transformer";
import { IsOptional, IsString, IsNumber, IsBoolean } from "class-validator";

import { TransformBooleanString } from "./transformers";

export class BackendConfig {
  @IsOptional()
  @IsString()
  public readonly CORS_ORIGIN = "http://localhost:*";

  @IsString()
  public readonly DATABASE_URL: string;

  @IsString()
  public readonly JWT_SECRET: string;

  @IsString()
  @IsOptional()
  public readonly JWT_EXPIRATION = "31d";

  @IsBoolean()
  @TransformBooleanString()
  public readonly RUN_SCHEDULED_ENTRIES = false;

  @IsNumber()
  @Type(() => Number)
  public readonly PORT = 3111;
}
