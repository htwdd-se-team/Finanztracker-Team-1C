import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, Length } from "class-validator";

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

export class RegisterDto extends LoginDto {
  @ApiProperty({
    description: "The given name of the user",
    example: "John",
  })
  @IsString()
  givenName: string;

  @ApiPropertyOptional({
    description: "The last name of the user",
    example: "Doe",
  })
  @IsString()
  @IsOptional()
  familyName?: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: "The token of the user",
    example: "token",
  })
  @IsString()
  token: string;
}
