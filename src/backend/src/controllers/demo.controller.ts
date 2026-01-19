import { Body, Controller, Logger, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { LoginResponseDto, RegisterDto } from "../dto";
import { AuthService, DemoService } from "../services";

@ApiTags("Demo")
@Controller("demo")
export class DemoController {
  constructor(
    private readonly demoService: DemoService,
    private readonly authService: AuthService,
  ) {}

  private readonly logger = new Logger(DemoController.name);

  @Post("create-account")
  @ApiOperation({
    summary: "Create a demo account with 1 year of transaction history",
    description:
      "Creates a new user account with pre-populated categories, recurring salary, " +
      "regular monthly expenses, and random events spanning the past year. " +
      "The account will have a realistic spending pattern where expenses nearly match income.",
  })
  @ApiOkResponse({
    type: LoginResponseDto,
    description: "Returns a JWT token for the newly created demo account",
  })
  async createDemoAccount(
    @Body() body: RegisterDto,
  ): Promise<LoginResponseDto> {
    this.logger.log(`Creating demo account for: ${body.email}`);

    const user = await this.demoService.createDemoAccount(body);

    return {
      token: this.authService.generateJwtToken(user),
    };
  }
}
