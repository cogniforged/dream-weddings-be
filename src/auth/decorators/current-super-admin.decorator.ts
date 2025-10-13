import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SuperAdminDocument } from '../../schemas/super-admin.schema';

export const CurrentSuperAdmin = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): SuperAdminDocument => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
