import { Body, Controller, Logger, Post } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AppService } from "src/app.service";
import { LoginResponseDto, LoginDto } from "src/dto";
import { PrismaService } from "src/services";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  private readonly logger = new Logger(AuthController.name);

  @Post("login")
  @ApiOkResponse({ type: LoginResponseDto })
  async login(@Body() body: LoginDto) {
    // sample login logic
    // const user = await this.prisma.user.findUnique({
    //   where: {
    //     email: body.email,
    //   },
    // });
    // if (!user) {
    //   throw new UnauthorizedException("Invalid credentials");
    // }
    // const isPasswordValid = await bcrypt.compare(
    //   body.password,
    //   user.passwordHash,
    // );
    // if (!isPasswordValid) {
    //   throw new UnauthorizedException("Invalid credentials");
    // }
  }
}
