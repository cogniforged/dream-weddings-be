import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SuperAdmin, SuperAdminDocument } from '../../schemas/super-admin.schema';

export interface SuperAdminJwtPayload {
  sub: string;
  email: string;
  type: 'super-admin';
}

@Injectable()
export class SuperAdminJwtStrategy extends PassportStrategy(Strategy, 'super-admin-jwt') {
  constructor(
    private configService: ConfigService,
    @InjectModel(SuperAdmin.name) private superAdminModel: Model<SuperAdminDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'default-secret',
    });
  }

  async validate(payload: SuperAdminJwtPayload): Promise<SuperAdminDocument> {
    if (payload.type !== 'super-admin') {
      throw new UnauthorizedException('Invalid token type');
    }

    const superAdmin = await this.superAdminModel.findById(payload.sub).exec();
    if (!superAdmin || !superAdmin.isActive) {
      throw new UnauthorizedException('Super admin not found or inactive');
    }
    return superAdmin;
  }
}
