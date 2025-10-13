import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SuperAdminService } from '../admin/super-admin.service';
import { SuperAdminLocalAuthGuard } from './guards/super-admin-local-auth.guard';
import { SuperAdminJwtAuthGuard } from './guards/super-admin-jwt-auth.guard';
import { CurrentSuperAdmin } from './decorators/current-super-admin.decorator';
import { SuperAdminDocument } from '../schemas/super-admin.schema';
import { SuperAdminJwtPayload } from './strategies/super-admin-jwt.strategy';

export class SuperAdminLoginDto {
  email: string;
  password: string;
}

@Controller('super-admin/auth')
export class SuperAdminAuthController {
  constructor(
    private superAdminService: SuperAdminService,
    private jwtService: JwtService,
  ) {}

  @Post('login')
  @UseGuards(SuperAdminLocalAuthGuard)
  async login(@CurrentSuperAdmin() superAdmin: SuperAdminDocument) {
    const payload: SuperAdminJwtPayload = {
      sub: superAdmin._id.toString(),
      email: superAdmin.email,
      type: 'super-admin',
    };

    const token = this.jwtService.sign(payload);

    return {
      superAdmin: {
        id: superAdmin._id,
        email: superAdmin.email,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        permissions: {
          canManageUsers: superAdmin.canManageUsers,
          canManageVendors: superAdmin.canManageVendors,
          canManageContent: superAdmin.canManageContent,
          canViewAnalytics: superAdmin.canViewAnalytics,
          canManageSystemSettings: superAdmin.canManageSystemSettings,
        },
      },
      token,
    };
  }

  @Get('profile')
  @UseGuards(SuperAdminJwtAuthGuard)
  async getProfile(@CurrentSuperAdmin() superAdmin: SuperAdminDocument) {
    return {
      id: superAdmin._id,
      email: superAdmin.email,
      firstName: superAdmin.firstName,
      lastName: superAdmin.lastName,
      phone: superAdmin.phone,
      isActive: superAdmin.isActive,
      lastLoginAt: superAdmin.lastLoginAt,
      permissions: {
        canManageUsers: superAdmin.canManageUsers,
        canManageVendors: superAdmin.canManageVendors,
        canManageContent: superAdmin.canManageContent,
        canViewAnalytics: superAdmin.canViewAnalytics,
        canManageSystemSettings: superAdmin.canManageSystemSettings,
      },
    };
  }
}
