import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UserDocument, UserRole } from '../../schemas/user.schema';

@Injectable()
export class VendorJwtStrategy extends PassportStrategy(
  Strategy,
  'vendor-jwt',
) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    const secret = configService.get<string>('VENDOR_JWT_SECRET');
    if (!secret) {
      throw new Error('VENDOR_JWT_SECRET environment variable is required');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<UserDocument> {
    // Validate that this is a vendor token
    if (payload.userType !== 'vendor' || payload.role !== 'vendor') {
      throw new UnauthorizedException('Invalid token type for vendor access');
    }

    const user = await this.authService.validateUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Double-check the user role
    if (user.role !== UserRole.VENDOR) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return user;
  }
}
