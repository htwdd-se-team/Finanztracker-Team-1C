import { ApiProperty } from "@nestjs/swagger";
import { IsInt } from "class-validator";

export class ScheduledEntriesSummaryDto {
  @ApiProperty({
    description: "Total number of scheduled entries",
    example: 15,
  })
  @IsInt()
  totalCount: number;

  @ApiProperty({
    description: "Total income amount in cents",
    example: 50000,
  })
  @IsInt()
  totalIncome: number;

  @ApiProperty({
    description: "Total expense amount in cents",
    example: 30000,
  })
  @IsInt()
  totalExpense: number;
}
