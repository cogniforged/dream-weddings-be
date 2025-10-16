import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { VendorsService } from './vendors.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import {
  CreateVendorDto,
  UpdateVendorDto,
  VendorQueryDto,
  VendorApprovalDto,
} from './dto/vendor.dto';
import {
  CreatePortfolioDto,
  UpdatePortfolioDto,
  PortfolioQueryDto,
} from '../portfolio/dto/portfolio.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminJwtAuthGuard } from '../auth/guards/super-admin-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentSuperAdmin } from '../auth/decorators/current-super-admin.decorator';
import { UserDocument, UserRole } from '../schemas/user.schema';
import { SuperAdminDocument } from '../schemas/super-admin.schema';

@Controller('vendors')
export class VendorsController {
  constructor(
    private readonly vendorsService: VendorsService,
    private readonly portfolioService: PortfolioService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async create(
    @Body() createVendorDto: CreateVendorDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.vendorsService.create(createVendorDto, user._id.toString());
  }

  @Get()
  async findAll(@Query() queryDto: VendorQueryDto) {
    return this.vendorsService.findAll(queryDto);
  }

  @Get('featured')
  async getFeaturedVendors(@Query('limit') limit?: number) {
    return this.vendorsService.getFeaturedVendors(limit);
  }

  @Get('category/:category')
  async getVendorsByCategory(
    @Param('category') category: string,
    @Query('limit') limit?: number,
  ) {
    return this.vendorsService.getVendorsByCategory(category as any, limit);
  }

  @Get('district/:district')
  async getVendorsByDistrict(
    @Param('district') district: string,
    @Query('limit') limit?: number,
  ) {
    return this.vendorsService.getVendorsByDistrict(district, limit);
  }

  @Get('pending')
  @UseGuards(SuperAdminJwtAuthGuard)
  async getPendingVendors(@CurrentSuperAdmin() superAdmin: SuperAdminDocument) {
    return this.vendorsService.getPendingVendors();
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async createProfile(
    @Body() createVendorDto: CreateVendorDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.vendorsService.create(createVendorDto, user._id.toString());
  }

  @Get('my-profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async getMyProfile(@CurrentUser() user: UserDocument) {
    return this.vendorsService.findByUserId(user._id.toString());
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async updateProfile(
    @Body() updateVendorDto: UpdateVendorDto,
    @CurrentUser() user: UserDocument,
  ) {
    const vendor = await this.vendorsService.findByUserId(user._id.toString());
    return this.vendorsService.update(vendor._id.toString(), updateVendorDto, user._id.toString());
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateVendorDto: UpdateVendorDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.vendorsService.update(id, updateVendorDto, user._id.toString());
  }

  @Patch(':id/approve')
  @UseGuards(SuperAdminJwtAuthGuard)
  async approveVendor(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() approvalDto: VendorApprovalDto,
    @CurrentSuperAdmin() superAdmin: SuperAdminDocument,
  ) {
    return this.vendorsService.approveVendor(
      id,
      approvalDto,
      superAdmin._id.toString(),
    );
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async getAnalytics(
    @CurrentUser() user: UserDocument,
    @Query('period') period?: string,
  ) {
    return this.vendorsService.getAnalytics(user._id.toString(), period);
  }

  // Portfolio routes - must be before @Get(':id') to avoid route conflicts
  @Post('portfolio')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async createPortfolio(
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
  async getPortfolioItem(@Param('id', ParseObjectIdPipe) id: string) {
    return this.portfolioService.findOne(id);
  }

  @Put('portfolio/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async updatePortfolio(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updatePortfolioDto: UpdatePortfolioDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.portfolioService.update(id, updatePortfolioDto, user._id.toString());
  }

  @Delete('portfolio/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async removePortfolio(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.portfolioService.remove(id, user._id.toString());
  }

  @Post('portfolio/:id/like')
  async likePortfolio(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.portfolioService.like(id, user._id.toString());
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.vendorsService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.vendorsService.remove(id, user._id.toString());
  }
}
