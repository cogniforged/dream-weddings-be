import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { User, UserSchema } from '../schemas/user.schema';
import { Lead, LeadSchema } from '../schemas/lead.schema';
import { Review, ReviewSchema } from '../schemas/review.schema';
import { VendorAccessMiddleware } from '../auth/middleware/vendor-access.middleware';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: Review.name, schema: ReviewSchema },
    ]),
  ],
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(VendorAccessMiddleware).forRoutes('vendors');
  }
}
