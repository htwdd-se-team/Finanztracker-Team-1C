import { Controller, Get, Logger, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";

import { UserDecorator } from "../decorators";
import { UserBalanceResponseDto, UserResponseDto } from "../dto";
import { JwtAuthGuard } from "../guards";
import { UserService } from "../services";

@ApiTags("User")
@ApiSecurity("user-jwt")
@UseGuards(JwtAuthGuard)
@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  private readonly logger = new Logger(UserController.name);

  @Get("me")
  @ApiOkResponse({ type: UserResponseDto })
  async getCurrentUser(@UserDecorator() user: User): Promise<UserResponseDto> {
    return this.userService.getUser(user);
  }

  @Get("balance")
  @ApiOkResponse({ type: UserBalanceResponseDto })
  async getBalance(
    @UserDecorator() user: User,
  ): Promise<UserBalanceResponseDto> {
    return this.userService.getBalance(user);
  }
}
