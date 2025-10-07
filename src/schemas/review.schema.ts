import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  vendorId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  customerId: Types.ObjectId;

  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true })
  comment: string;

  @Prop()
  weddingDate?: Date;

  @Prop()
  serviceCategory?: string;

  @Prop({ default: false })
  isVerified?: boolean;

  @Prop()
  photos?: string[];

  @Prop({ default: false })
  isFeatured?: boolean;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Indexes
ReviewSchema.index({ vendorId: 1 });
ReviewSchema.index({ customerId: 1 });
ReviewSchema.index({ rating: -1 });
ReviewSchema.index({ createdAt: -1 });
ReviewSchema.index({ isFeatured: 1 });
