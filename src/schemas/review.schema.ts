import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review &
  Document<Types.ObjectId> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true })
  vendorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Booking' })
  bookingId?: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  title?: string;

  @Prop()
  comment?: string;

  @Prop([String])
  images?: string[];

  @Prop()
  serviceCategory?: string;

  @Prop()
  weddingDate?: Date;

  @Prop()
  venue?: string;

  @Prop()
  guestCount?: number;

  @Prop()
  budget?: number;

  @Prop({ type: [String] })
  pros?: string[];

  @Prop({ type: [String] })
  cons?: string[];

  @Prop()
  wouldRecommend?: boolean;

  @Prop()
  communicationRating?: number;

  @Prop()
  qualityRating?: number;

  @Prop()
  valueRating?: number;

  @Prop()
  timelinessRating?: number;

  @Prop({ default: 0 })
  helpfulCount: number;

  @Prop({ default: 0 })
  notHelpfulCount: number;

  @Prop()
  vendorResponse?: string;

  @Prop()
  vendorResponseDate?: Date;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: true })
  isPublished: boolean;

  @Prop()
  publishedAt?: Date;

  @Prop()
  reportedAt?: Date;

  @Prop()
  reportedReason?: string;

  @Prop()
  moderatedAt?: Date;

  @Prop()
  moderatedBy?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Create compound index to prevent duplicate reviews
ReviewSchema.index(
  { customerId: 1, vendorId: 1, bookingId: 1 },
  { unique: true },
);
