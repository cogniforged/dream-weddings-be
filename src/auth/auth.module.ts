import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { SuperAdminAuthController } from './super-admin-auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { SuperAdminLocalStrategy } from './strategies/super-admin-local.strategy';
import { SuperAdminJwtStrategy } from './strategies/super-admin-jwt.strategy';
import { User, UserSchema } from '../schemas/user.schema';
import { SuperAdmin, SuperAdminSchema } from '../schemas/super-admin.schema';
import { SuperAdminService } from '../admin/super-admin.service';
import { StringValue } from 'ms';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: SuperAdmin.name, schema: SuperAdminSchema },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'default-secret',
        signOptions: {
          expiresIn: (configService.get<string>('jwt.expiresIn') ||
            '24h') as StringValue,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, SuperAdminAuthController],
  providers: [
    AuthService,
    SuperAdminService,
    JwtStrategy,
    LocalStrategy,
    SuperAdminLocalStrategy,
    SuperAdminJwtStrategy,
  ],
  exports: [AuthService, SuperAdminService],
})
export class AuthModule {}
