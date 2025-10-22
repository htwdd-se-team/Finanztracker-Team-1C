import { ApiProperty } from "@nestjs/swagger";

export class MaxValueDto {
  @ApiProperty({
    example: "1000",
    description:
      "Maximaler Betrag des Nutzers in Euro (auf 100er gerundet), als String",
  })
  maxPrice!: number;
}
