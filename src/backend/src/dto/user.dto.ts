import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsEmail, IsOptional, IsString } from "class-validator";

export class UserResponseDto {
  @ApiProperty({
    description: "The given name of the user",
    example: "John",
  })
  @IsString()
  givenName: string;

  @ApiPropertyOptional({
    description: "The family name of the user",
    example: "Doe",
  })
  @IsString()
  @IsOptional()
  familyName?: string;

  @ApiProperty({
    description: "The email of the user",
    example: "john.doe@example.com",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "User creation timestamp",
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;
}
