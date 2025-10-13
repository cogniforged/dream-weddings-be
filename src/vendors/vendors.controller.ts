import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { VendorsService } from './vendors.service';
import {
  CreateVendorDto,
  UpdateVendorDto,
  VendorQueryDto,
  VendorApprovalDto,
} from './dto/vendor.dto';
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
  constructor(private readonly vendorsService: VendorsService) {}

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

  @Get('my-profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async getMyProfile(@CurrentUser() user: UserDocument) {
    return this.vendorsService.findByUserId(user._id.toString());
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.vendorsService.findOne(id);
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
