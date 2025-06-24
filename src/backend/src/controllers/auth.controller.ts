import { Body, Controller, Logger, Post } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { LoginResponseDto, LoginDto, RegisterDto } from "../dto";
import { AuthService } from "../services";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private readonly logger = new Logger(AuthController.name);

  @Post("login")
  @ApiOkResponse({ type: LoginResponseDto })
  async login(@Body() body: LoginDto): Promise<LoginResponseDto> {
    const user = await this.authService.validateUser(body.email, body.password);

    return {
      token: this.authService.generateJwtToken(user),
    };
  }

  @Post("register")
  @ApiOkResponse({ type: LoginResponseDto })
  async register(@Body() body: RegisterDto): Promise<LoginResponseDto> {
    const user = await this.authService.register(body);

    return {
      token: this.authService.generateJwtToken(user),
    };
  }
}
