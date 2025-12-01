import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsInt, ValidateNested } from "class-validator";

export class ScheduledMonthlyTotalDto {
  @ApiProperty({ description: "Month number (1-12)", example: 1 })
  @IsInt()
  month: number;

  @ApiProperty({ description: "Sum of incomes in cents", example: 10000 })
  @IsInt()
  income: number;

  @ApiProperty({ description: "Sum of expenses in cents", example: 5000 })
  @IsInt()
  expense: number;

  @ApiProperty({
    description: "Net (income - expense) in cents",
    example: 5000,
  })
  @IsInt()
  net: number;
}

export class ScheduledMonthlyTotalsResponseDto {
  @ApiProperty({ type: ScheduledMonthlyTotalDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduledMonthlyTotalDto)
  totals: ScheduledMonthlyTotalDto[];
}
