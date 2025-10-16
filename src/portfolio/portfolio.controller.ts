import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { PortfolioService } from './portfolio.service';
import {
  CreatePortfolioDto,
  UpdatePortfolioDto,
  PortfolioQueryDto,
} from './dto/portfolio.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDocument, UserRole } from '../schemas/user.schema';

@Controller('vendors')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post('portfolio')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async create(
    @Body() createPortfolioDto: CreatePortfolioDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.portfolioService.create(createPortfolioDto, user._id.toString());
  }

  @Get('portfolio')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async getMyPortfolio(
    @Query() queryDto: PortfolioQueryDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.portfolioService.findAll(queryDto, user._id.toString());
  }

  @Get('portfolio/:id')
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.portfolioService.findOne(id);
  }

  @Put('portfolio/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updatePortfolioDto: UpdatePortfolioDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.portfolioService.update(id, updatePortfolioDto, user._id.toString());
  }

  @Delete('portfolio/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.portfolioService.remove(id, user._id.toString());
  }

  @Post('portfolio/:id/like')
  async like(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.portfolioService.like(id, user._id.toString());
  }

  // Public endpoint to get vendor's portfolio
  @Get(':vendorId/portfolio')
  async getVendorPortfolio(@Param('vendorId', ParseObjectIdPipe) vendorId: string) {
    return this.portfolioService.getVendorPortfolio(vendorId);
  }
}
