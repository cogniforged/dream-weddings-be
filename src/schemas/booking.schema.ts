import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking &
  Document<Types.ObjectId> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

@Schema({ timestamps: true })
export class BookingPackage {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 'LKR' })
  currency: string;

  @Prop({ type: [String] })
  inclusions?: string[];

  @Prop({ type: [String] })
  exclusions?: string[];

  @Prop()
  duration?: string;

  @Prop({ type: [String] })
  deliverables?: string[];
}

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true })
  vendorId: Types.ObjectId;

  @Prop({ required: true })
  serviceName: string;

  @Prop({ required: true })
  serviceCategory: string;

  @Prop({ required: true })
  bookingDate: Date;

  @Prop()
  endDate?: Date;

  @Prop()
  startTime?: string;

  @Prop()
  endTime?: string;

  @Prop()
  venue?: string;

  @Prop()
  guestCount?: number;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ default: 'LKR' })
  currency: string;

  @Prop({ enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop()
  paidAmount?: number;

  @Prop()
  remainingAmount?: number;

  @Prop([BookingPackage])
  packages: BookingPackage[];

  @Prop()
  specialRequirements?: string;

  @Prop()
  notes?: string;

  @Prop()
  cancellationReason?: string;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancelledBy?: Types.ObjectId;

  @Prop()
  refundAmount?: number;

  @Prop()
  refundReason?: string;

  @Prop()
  completedAt?: Date;

  @Prop()
  rating?: number;

  @Prop()
  review?: string;

  @Prop()
  reviewDate?: Date;

  @Prop()
  contractUrl?: string;

  @Prop()
  invoiceUrl?: string;

  @Prop()
  receiptUrl?: string;

  @Prop()
  reminderSent?: boolean;

  @Prop()
  reminderDate?: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
