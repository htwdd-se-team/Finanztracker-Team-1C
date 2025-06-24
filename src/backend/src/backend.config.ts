import { Type } from "class-transformer";
import { IsOptional, IsString, IsNumber } from "class-validator";

export class BackendConfig {
  @IsOptional()
  @IsString()
  public readonly CORS_ORIGIN = "http://localhost:3000";

  @IsString()
  public readonly DATABASE_URL: string;

  @IsString()
  public readonly JWT_SECRET: string;

  @IsString()
  @IsOptional()
  public readonly JWT_EXPIRATION = "31d";

  @IsNumber()
  @Type(() => Number)
  public readonly PORT = 3111;
}
