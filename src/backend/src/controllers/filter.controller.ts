import {
  Controller,
  Post,
  Body,
  UseGuards,
  Delete,
  Put,
  Get,
  Param,
  ParseIntPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiNotFoundResponse,
} from "@nestjs/swagger";
import { User } from "@prisma/client";

import { UserDecorator } from "../decorators";
import { CreateFilterDto, FilterResponseDto, UpdateFilterDto } from "../dto";
import { JwtAuthGuard } from "../guards";
import { FilterService } from "../services";

@ApiTags("Filter")
@Controller("filters")
@ApiSecurity("user-jwt")
@UseGuards(JwtAuthGuard)
export class FilterController {
  constructor(private readonly filterService: FilterService) {}

  @Post("create")
  @ApiOkResponse({
    type: FilterResponseDto,
    description: "Filter created successfully",
  })
  @ApiBadRequestResponse({ description: "Invalid input data" })
  async create(
    @UserDecorator() user: User,
    @Body() createFilterDto: CreateFilterDto,
  ): Promise<FilterResponseDto> {
    return this.filterService.createFilter(user, createFilterDto);
  }

  @Get("list")
  @ApiOkResponse({
    type: FilterResponseDto,
    isArray: true,
    description: "Filters fetched successfully",
  })
  async list(@UserDecorator() user: User): Promise<FilterResponseDto[]> {
    return this.filterService.getFilters(user);
  }

  @Delete(":id")
  @ApiOkResponse({ description: "Filter deleted successfully" })
  @ApiNotFoundResponse({
    description: "Filter not found or not authorized to delete",
  })
  async delete(
    @UserDecorator() user: User,
    @Param("id", ParseIntPipe) filterId: number,
  ): Promise<void> {
    await this.filterService.deleteFilter(user, filterId);
  }

  @Put(":id")
  @ApiOkResponse({
    type: FilterResponseDto,
    description: "Filter updated successfully",
  })
  @ApiNotFoundResponse({
    description: "Filter not found or not authorized to update",
  })
  @ApiBadRequestResponse({ description: "Invalid input data" })
  async update(
    @UserDecorator() user: User,
    @Param("id", ParseIntPipe) filterId: number,
    @Body() data: UpdateFilterDto,
  ): Promise<FilterResponseDto> {
    return this.filterService.updateFilter(user, filterId, data);
  }
}
