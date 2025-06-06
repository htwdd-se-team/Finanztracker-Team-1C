import { Type } from "class-transformer";
import { IsOptional, IsString, IsNumber } from "class-validator";

export class BackendConfig {
  @IsOptional()
  @IsString()
  public readonly CORS_ORIGIN?: string;

  @IsString()
  public readonly DATABASE_URL: string;

  @IsNumber()
  @Type(() => Number)
  public readonly PORT = 3111;
}
