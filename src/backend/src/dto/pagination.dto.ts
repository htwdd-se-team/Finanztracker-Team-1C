import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class PaginationDto {
  @ApiProperty({
    description: "The number of items to return",
    minimum: 1,
    maximum: 30,
    default: 10,
  })
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(30)
  take: number;

  @ApiPropertyOptional({
    description: "The ID of the last item in the previous page",
  })
  @IsOptional()
  @IsInt()
  cursorId?: number;
}
