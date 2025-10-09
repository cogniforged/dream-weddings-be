import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class VendorAccessMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract user from request (set by auth guards)
    const user = (req as any).user;

    // Skip middleware for public routes
    if (this.isPublicRoute(req.path)) {
      return next();
    }

    // Skip middleware for non-vendor routes
    if (!this.isVendorRoute(req.path)) {
      return next();
    }

    // Strict validation for vendor routes
    this.validateVendorAccess(req, user);

    next();
  }

  private isPublicRoute(path: string): boolean {
    const publicRoutes = [
      '/auth/login',
      '/auth/register',
      '/auth/customer/login',
      '/auth/vendor/login',
      '/health',
      '/api/docs',
    ];

    return publicRoutes.some((route) => path.startsWith(route));
  }

  private isVendorRoute(path: string): boolean {
    const vendorRoutes = [
      '/vendors/me',
      '/vendors/dashboard',
      '/vendors/analytics',
      '/vendors/leads',
      '/vendors/portfolio',
      '/vendors/packages',
      '/auth/vendor/stats',
    ];

    return (
      vendorRoutes.some((route) => path.startsWith(route)) ||
      path.includes('/vendor/')
    );
  }

  private validateVendorAccess(req: Request, user: any): void {
    // Check if user is authenticated
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Strict role validation
    if (user.role !== 'vendor') {
      throw new ForbiddenException('Access denied');
    }

    // Validate token type
    if (user.userType !== 'vendor') {
      throw new ForbiddenException('Invalid token');
    }

    // Check account status
    if (!user.isActive) {
      throw new ForbiddenException('Account access denied');
    }

    // Additional security validations
    this.performSecurityValidations(req, user);
  }

  private performSecurityValidations(req: Request, user: any): void {
    // Check request method and path combinations
    const method = req.method;
    const path = req.path;

    // Strict validation for sensitive operations
    if (method === 'POST' && path.includes('/vendors/me/')) {
      this.validateSensitiveOperation(req, user);
    }

    if (method === 'PUT' && path.includes('/vendors/me/')) {
      this.validateSensitiveOperation(req, user);
    }

    if (method === 'DELETE' && path.includes('/vendors/')) {
      this.validateSensitiveOperation(req, user);
    }

    // Check for suspicious request patterns
    this.checkSuspiciousPatterns(req, user);
  }

  private validateSensitiveOperation(req: Request, user: any): void {
    // Additional validation for sensitive operations
    const userAgent = req.headers['user-agent'];
    if (!userAgent || userAgent.length < 15) {
      throw new ForbiddenException(
        'Suspicious request detected - Access denied',
      );
    }

    // Check for required headers
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      throw new ForbiddenException(
        'Invalid request format - JSON content required',
      );
    }

    // Validate request body for sensitive operations
    if (req.body && typeof req.body === 'object') {
      this.validateRequestBody(req.body, user);
    }
  }

  private validateRequestBody(body: any, user: any): void {
    // Check for attempts to modify critical vendor data
    if (body.role && body.role !== 'vendor') {
      throw new ForbiddenException('Role modification not allowed');
    }

    if (body.userType && body.userType !== 'vendor') {
      throw new ForbiddenException('User type modification not allowed');
    }

    if (body.isActive !== undefined) {
      throw new ForbiddenException('Account status modification not allowed');
    }

    if (body.isVerified !== undefined) {
      throw new ForbiddenException(
        'Verification status modification not allowed',
      );
    }
  }

  private checkSuspiciousPatterns(req: Request, user: any): void {
    // Check for rapid successive requests (basic rate limiting)
    const now = Date.now();
    const lastRequest = (req as any).lastVendorRequest || 0;

    if (now - lastRequest < 100) {
      // Less than 100ms between requests
      throw new ForbiddenException(
        'Request rate limit exceeded - Suspicious activity detected',
      );
    }

    (req as any).lastVendorRequest = now;

    // Check for suspicious headers
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip'];
    for (const header of suspiciousHeaders) {
      if (req.headers[header] && Array.isArray(req.headers[header])) {
        throw new ForbiddenException('Suspicious proxy headers detected');
      }
    }

    // Validate referer for dashboard access
    if (req.path.includes('/dashboard') || req.path.includes('/analytics')) {
      const referer = req.headers.referer;
      if (
        referer &&
        !referer.includes('vendor') &&
        !referer.includes('dashboard')
      ) {
        throw new ForbiddenException(
          'Invalid access source for vendor dashboard',
        );
      }
    }
  }
}
