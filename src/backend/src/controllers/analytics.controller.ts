import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOkResponse, ApiSecurity } from "@nestjs/swagger";
import { User } from "@prisma/client";

import { UserDecorator } from "../decorators";
import {
  TransactionBalanceHistoryParamsDto,
  TransactionBreakdownParamsDto,
  TransactionBreakdownResponseDto,
  TransactionItemDto,
  AvailableCapitalItemDto,
  MaxValueDto,
} from "../dto";
import { JwtAuthGuard } from "../guards";
import { AnalyticsService } from "../services";

@ApiTags("analytics")
@Controller("analytics")
@ApiSecurity("user-jwt")
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("filter-details")
  @ApiOkResponse({
    type: MaxValueDto,
    description: "Highest transaction value fetched successfully",
  })
  async filterDetails(@UserDecorator() user: User): Promise<MaxValueDto> {
    const maxPrice =
      await this.analyticsService.getMaxTransactionAmountForUser(user);
    return { maxPrice };
  }

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

  @Get("transaction-balance-history")
  @ApiOkResponse({
    type: TransactionItemDto,
    description: "Transaction balance history fetched successfully",
    isArray: true,
  })
  async getTransactionBalanceHistory(
    @UserDecorator() user: User,
    @Query() params: TransactionBalanceHistoryParamsDto,
  ): Promise<TransactionItemDto[]> {
    return this.analyticsService.getTransactionBalanceHistory(user, params);
  }

  @Get("available-capital")
  @ApiOkResponse({
    type: AvailableCapitalItemDto,
    description:
      "Available capital and scheduled transfers for the current month",
    isArray: true,
  })
  async getAvailableCapital(
    @UserDecorator() user: User,
  ): Promise<AvailableCapitalItemDto[]> {
    return this.analyticsService.getAvailableCapital(user);
  }
}
