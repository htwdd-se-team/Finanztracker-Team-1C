import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length } from "class-validator";

export class LoginDto {
  @IsEmail()
  @ApiProperty({
    description: "The email of the user",
    example: "test@test.com",
  })
  email: string;

  @IsString()
  @Length(8, 30)
  @ApiProperty({
    description: "The password of the user",
    example: "password",
  })
  password: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: "The token of the user",
    example: "token",
  })
  @IsString()
  token: string;
}
