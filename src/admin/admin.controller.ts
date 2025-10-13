import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  AdminStatsQueryDto,
  UserQueryDto,
  VendorQueryDto,
  ContentQueryDto,
  UpdateUserStatusDto,
  UpdateVendorStatusDto,
  UpdateContentStatusDto,
  FeaturedListingDto,
} from './dto/admin.dto';
import { SuperAdminJwtAuthGuard } from '../auth/guards/super-admin-jwt-auth.guard';
import { CurrentSuperAdmin } from '../auth/decorators/current-super-admin.decorator';
import { SuperAdminDocument } from '../schemas/super-admin.schema';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@Controller('admin')
@UseGuards(SuperAdminJwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboardStats(@Query() queryDto: AdminStatsQueryDto) {
    return this.adminService.getDashboardStats(queryDto);
  }

  @Get('analytics')
  async getAnalytics(@Query() queryDto: AdminStatsQueryDto) {
    return this.adminService.getAnalytics(queryDto);
  }

  @Get('activity')
  async getRecentActivity(@Query('limit') limit?: number) {
    return this.adminService.getRecentActivity(limit);
  }

  // User management
  @Get('users')
  async getUsers(@Query() queryDto: UserQueryDto) {
    return this.adminService.getUsers(queryDto);
  }

  @Patch('users/:userId/status')
  async updateUserStatus(
    @Param('userId', ParseObjectIdPipe) userId: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
    @CurrentSuperAdmin() superAdmin: SuperAdminDocument,
  ) {
    return this.adminService.updateUserStatus(
      userId.toString(),
      updateUserStatusDto,
      superAdmin._id.toString(),
    );
  }

  // Vendor management
  @Get('vendors')
  async getVendors(@Query() queryDto: VendorQueryDto) {
    return this.adminService.getVendors(queryDto);
  }

  @Patch('vendors/:vendorId/status')
  async updateVendorStatus(
    @Param('vendorId', ParseObjectIdPipe) vendorId: string,
    @Body() updateVendorStatusDto: UpdateVendorStatusDto,
    @CurrentSuperAdmin() superAdmin: SuperAdminDocument,
  ) {
    return this.adminService.updateVendorStatus(
      vendorId.toString(),
      updateVendorStatusDto,
      superAdmin._id.toString(),
    );
  }

  // Content management
  @Get('content')
  async getContent(@Query() queryDto: ContentQueryDto) {
    return this.adminService.getContent(queryDto);
  }

  @Patch('content/:contentId/status')
  async updateContentStatus(
    @Param('contentId', ParseObjectIdPipe) contentId: string,
    @Body() updateContentStatusDto: UpdateContentStatusDto,
    @CurrentSuperAdmin() superAdmin: SuperAdminDocument,
  ) {
    return this.adminService.updateContentStatus(
      contentId.toString(),
      updateContentStatusDto,
      superAdmin._id.toString(),
    );
  }

  // Featured listings
  @Post('featured')
  async updateFeaturedListing(
    @Body() featuredListingDto: FeaturedListingDto,
    @CurrentSuperAdmin() superAdmin: SuperAdminDocument,
  ) {
    return this.adminService.updateFeaturedListing(
      featuredListingDto,
      superAdmin._id.toString(),
    );
  }
}
