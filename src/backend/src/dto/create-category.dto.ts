import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class CreateCategoryDto {
  @ApiProperty({ example: "Lebensmittel" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "Gruen" })
  @IsString()
  @IsNotEmpty()
  color: string;

  @ApiProperty({ example: "shopping-cart" })
  @IsString()
  @IsNotEmpty()
  icon: string;
}
