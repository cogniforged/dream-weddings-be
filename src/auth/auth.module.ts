import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';
import { VendorJwtStrategy } from './strategies/vendor-jwt.strategy';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
  imports: [
    PassportModule,
    // Customer-specific JWT module
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('CUSTOMER_JWT_SECRET');
        if (!secret) {
          throw new Error(
            'CUSTOMER_JWT_SECRET environment variable is required',
          );
        }
        return {
          secret,
          signOptions: {
            expiresIn: '24h', // Customer tokens expire in 24 hours
          },
        };
      },
      inject: [ConfigService],
    }),
    // Vendor-specific JWT module
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('VENDOR_JWT_SECRET');
        if (!secret) {
          throw new Error('VENDOR_JWT_SECRET environment variable is required');
        }
        return {
          secret,
          signOptions: {
            expiresIn: '7d', // Vendor tokens expire in 7 days
          },
        };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, CustomerJwtStrategy, VendorJwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
