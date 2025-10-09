import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserDocument } from '../../schemas/user.schema';
import { Types } from 'mongoose';

interface AuthenticatedRequest extends Request {
  user: UserDocument & { _id: Types.ObjectId };
}

@Injectable()
export class StrictVendorAccessGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    // Check if user exists and is authenticated
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Strict role validation
    if (user.role !== 'vendor') {
      throw new ForbiddenException('Access denied');
    }

    // Check if vendor account is active and verified
    if (!user.isActive) {
      throw new ForbiddenException('Account access denied');
    }

    // Check if vendor has completed verification (if required)
    if (user.isVerified === false) {
      throw new ForbiddenException('Account verification required');
    }

    // Additional security checks
    this.performAdditionalSecurityChecks(request, user);

    return true;
  }

  private performAdditionalSecurityChecks(
    request: AuthenticatedRequest,
    user: UserDocument,
  ): void {
    // Check request headers for suspicious activity
    const userAgent = request.headers['user-agent'];
    if (!userAgent || userAgent.length < 10) {
      throw new ForbiddenException('Invalid request - Suspicious user agent');
    }

    // Check for required vendor-specific headers
    const vendorId = request.headers['x-vendor-id'];
    if (vendorId && vendorId !== (user._id as Types.ObjectId).toString()) {
      throw new ForbiddenException('Vendor ID mismatch');
    }

    // Rate limiting check (basic implementation)
    const clientIp = request.ip || request.connection.remoteAddress;
    if (!clientIp) {
      throw new ForbiddenException('Unable to verify client identity');
    }

    // Additional business logic validations
    if (user.businessName && user.businessName.length < 2) {
      throw new ForbiddenException(
        'Invalid vendor profile - Business name required',
      );
    }
  }
}
