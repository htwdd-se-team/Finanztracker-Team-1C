import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOkResponse, ApiSecurity } from "@nestjs/swagger";
import { User } from "@prisma/client";

import { UserDecorator } from "../decorators";
import {
  TransactionBreakdownParamsDto,
  TransactionBreakdownResponseDto,
} from "../dto";
import { JwtAuthGuard } from "../guards";
import { AnalyticsService } from "../services";

@ApiTags("analytics")
@Controller("analytics")
@ApiSecurity("user-jwt")
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("transaction-breakdown")
  @ApiOkResponse({
    type: TransactionBreakdownResponseDto,
    description: "Transaction breakdown data fetched successfully",
  })
  async getTransactionBreakdown(
    @UserDecorator() user: User,
    @Query() params: TransactionBreakdownParamsDto,
  ): Promise<TransactionBreakdownResponseDto> {
    return this.analyticsService.getTransactionBreakdown(user, params);
  }
}
