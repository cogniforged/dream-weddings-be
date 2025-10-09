import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CustomerAuthGuard extends AuthGuard('customer-jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any): any {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }

    // Additional validation to ensure this is a customer
    if (
      user &&
      typeof user === 'object' &&
      'role' in user &&
      (user as { role: string }).role !== 'customer'
    ) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return user;
  }
}
