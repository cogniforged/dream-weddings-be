import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class VendorAuthGuard extends AuthGuard('vendor-jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any): any {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }

    // Additional validation to ensure this is a vendor
    if (
      user &&
      typeof user === 'object' &&
      'role' in user &&
      (user as { role: string }).role !== 'vendor'
    ) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return user;
  }
}
