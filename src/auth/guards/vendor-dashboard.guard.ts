import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

interface VendorUser {
  _id: string;
  role: string;
  userType: string;
  isActive: boolean;
  businessName?: string;
  category?: string;
  isVerified?: boolean;
  dashboardAccess?: boolean;
  accountStatus?: string;
  vendorId?: string;
}

@Injectable()
export class VendorDashboardGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as VendorUser;

    // Multiple layers of validation for vendor dashboard access
    this.validateVendorAuthentication(user);
    this.validateVendorProfile(user);
    this.validateAccessPermissions(user);
    this.validateSecurityContext(request, user);

    return true;
  }

  private validateVendorAuthentication(user: VendorUser): void {
    if (!user) {
      throw new UnauthorizedException(
        'Authentication required for vendor dashboard',
      );
    }

    if (user.role !== 'vendor') {
      throw new ForbiddenException(
        'Vendor dashboard access denied - Customer accounts cannot access vendor dashboard',
      );
    }

    if (user.userType !== 'vendor') {
      throw new ForbiddenException('Invalid token');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account access denied');
    }
  }

  private validateVendorProfile(user: VendorUser): void {
    // Ensure vendor has complete profile
    if (!user.businessName) {
      throw new ForbiddenException('Profile incomplete');
    }

    if (!user.category) {
      throw new ForbiddenException('Profile incomplete');
    }

    // Check if vendor has been verified (if verification is required)
    if (user.isVerified === false) {
      throw new ForbiddenException('Account verification required');
    }
  }

  private validateAccessPermissions(user: VendorUser): void {
    // Check if vendor has dashboard access permissions
    if (user.dashboardAccess === false) {
      throw new ForbiddenException(
        'Dashboard access has been revoked for this vendor account',
      );
    }

    // Check if vendor account is in good standing
    if (user.accountStatus === 'suspended') {
      throw new ForbiddenException(
        'Vendor account is suspended - Dashboard access denied',
      );
    }

    if (user.accountStatus === 'pending') {
      throw new ForbiddenException(
        'Vendor account is pending approval - Dashboard access not yet available',
      );
    }
  }

  private validateSecurityContext(request: Request, user: VendorUser): void {
    // Validate request context
    const userAgent = request.headers['user-agent'];
    if (!userAgent || userAgent.length < 20) {
      throw new ForbiddenException(
        'Invalid request context - Suspicious access attempt',
      );
    }

    // Check for vendor-specific security headers
    const vendorToken = request.headers['x-vendor-token'];
    if (vendorToken && vendorToken !== user.vendorId) {
      throw new ForbiddenException('Security token mismatch - Access denied');
    }

    // Validate IP address (basic check)
    const clientIp = request.ip || request.connection.remoteAddress;
    if (!clientIp) {
      throw new ForbiddenException(
        'Unable to verify client identity - Access denied',
      );
    }

    const referer = request.headers.referer;
    if (
      referer &&
      !referer.includes('vendor') &&
      !referer.includes('dashboard')
    ) {
      throw new ForbiddenException(
        'Invalid access source - Dashboard access from unauthorized source',
      );
    }
  }
}
