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
import {
  AdminDashboardStats,
  AdminAnalytics,
  RecentActivity,
  AdminNotifications,
  PaginatedUsersResponse,
  PaginatedVendorsResponse,
  PaginatedContentResponse,
  FeaturedListingResponse,
} from './interfaces/admin.interface';
import { UserDocument } from '../schemas/user.schema';
import { VendorDocument } from '../schemas/vendor.schema';
import { IdeaDocument } from '../schemas/idea.schema';

@Controller('admin')
@UseGuards(SuperAdminJwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboardStats(
    @Query() queryDto: AdminStatsQueryDto,
  ): Promise<AdminDashboardStats> {
    return this.adminService.getDashboardStats(queryDto);
  }

  @Get('analytics')
  async getAnalytics(
    @Query() queryDto: AdminStatsQueryDto,
  ): Promise<AdminAnalytics> {
    return this.adminService.getAnalytics(queryDto);
  }

  @Get('activity')
  async getRecentActivity(
    @Query('limit') limit?: number,
  ): Promise<RecentActivity[]> {
    return this.adminService.getRecentActivity(limit);
  }

  @Get('notifications')
  async getNotifications(): Promise<AdminNotifications> {
    return this.adminService.getNotifications();
  }

  // User management
  @Get('users')
  async getUsers(
    @Query() queryDto: UserQueryDto,
  ): Promise<PaginatedUsersResponse> {
    return this.adminService.getUsers(queryDto);
  }

  @Patch('users/:userId/status')
  async updateUserStatus(
    @Param('userId', ParseObjectIdPipe) userId: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
    @CurrentSuperAdmin() superAdmin: SuperAdminDocument,
  ): Promise<UserDocument> {
    return this.adminService.updateUserStatus(
      userId.toString(),
      updateUserStatusDto,
      superAdmin._id.toString(),
    );
  }

  // Vendor management
  @Get('vendors')
  async getVendors(
    @Query() queryDto: VendorQueryDto,
  ): Promise<PaginatedVendorsResponse> {
    return this.adminService.getVendors(queryDto);
  }

  @Patch('vendors/:vendorId/status')
  async updateVendorStatus(
    @Param('vendorId', ParseObjectIdPipe) vendorId: string,
    @Body() updateVendorStatusDto: UpdateVendorStatusDto,
    @CurrentSuperAdmin() superAdmin: SuperAdminDocument,
  ): Promise<VendorDocument> {
    return this.adminService.updateVendorStatus(
      vendorId.toString(),
      updateVendorStatusDto,
      superAdmin._id.toString(),
    );
  }

  // Content management
  @Get('content')
  async getContent(
    @Query() queryDto: ContentQueryDto,
  ): Promise<PaginatedContentResponse> {
    return this.adminService.getContent(queryDto);
  }

  @Patch('content/:contentId/status')
  async updateContentStatus(
    @Param('contentId', ParseObjectIdPipe) contentId: string,
    @Body() updateContentStatusDto: UpdateContentStatusDto,
    @CurrentSuperAdmin() superAdmin: SuperAdminDocument,
  ): Promise<IdeaDocument> {
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
  ): Promise<FeaturedListingResponse> {
    return this.adminService.updateFeaturedListing(
      featuredListingDto,
      superAdmin._id.toString(),
    );
  }
}
