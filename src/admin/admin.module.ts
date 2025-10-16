import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SuperAdminService } from './super-admin.service';
import { User, UserSchema } from '../schemas/user.schema';
import { Vendor, VendorSchema } from '../schemas/vendor.schema';
import { Idea, IdeaSchema } from '../schemas/idea.schema';
import { Booking, BookingSchema } from '../schemas/booking.schema';
import { Review, ReviewSchema } from '../schemas/review.schema';
import { Inquiry, InquirySchema } from '../schemas/inquiry.schema';
import { SuperAdmin, SuperAdminSchema } from '../schemas/super-admin.schema';
import { EmailService } from '../common/services/email.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: Idea.name, schema: IdeaSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Inquiry.name, schema: InquirySchema },
      { name: SuperAdmin.name, schema: SuperAdminSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, SuperAdminService, EmailService],
  exports: [AdminService, SuperAdminService],
})
export class AdminModule {}
