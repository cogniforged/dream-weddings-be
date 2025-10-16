import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { Vendor, VendorSchema } from '../schemas/vendor.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Booking, BookingSchema } from '../schemas/booking.schema';
import { Inquiry, InquirySchema } from '../schemas/inquiry.schema';
import { Portfolio, PortfolioSchema } from '../schemas/portfolio.schema';
import { EmailService } from '../common/services/email.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vendor.name, schema: VendorSchema },
      { name: User.name, schema: UserSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Inquiry.name, schema: InquirySchema },
      { name: Portfolio.name, schema: PortfolioSchema },
    ]),
  ],
  controllers: [VendorsController],
  providers: [VendorsService, PortfolioService, EmailService],
  exports: [VendorsService],
})
export class VendorsModule {}
