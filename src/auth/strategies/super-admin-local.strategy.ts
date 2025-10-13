import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { SuperAdminService } from '../../admin/super-admin.service';
import { SuperAdminDocument } from '../../schemas/super-admin.schema';

@Injectable()
export class SuperAdminLocalStrategy extends PassportStrategy(Strategy, 'super-admin-local') {
  constructor(private superAdminService: SuperAdminService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<SuperAdminDocument> {
    const superAdmin = await this.superAdminService.validateSuperAdmin(email, password);
    if (!superAdmin) {
      throw new UnauthorizedException('Invalid super admin credentials');
    }
    return superAdmin;
  }
}
