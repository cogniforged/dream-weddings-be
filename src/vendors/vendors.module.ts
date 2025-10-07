import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { User, UserSchema } from '../schemas/user.schema';
import { Lead, LeadSchema } from '../schemas/lead.schema';
import { Review, ReviewSchema } from '../schemas/review.schema';

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
export class VendorsModule {}
