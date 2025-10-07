import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LeadDocument = Lead & Document;

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUOTED = 'quoted',
  BOOKED = 'booked',
  LOST = 'lost',
}

@Schema({ timestamps: true })
export class Lead {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  vendorId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  customerId: Types.ObjectId;

  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  customerEmail: string;

  @Prop({ required: true })
  customerPhone: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, enum: LeadStatus, default: LeadStatus.NEW })
  status: LeadStatus;

  @Prop()
  vendorResponse?: string;

  @Prop()
  quoteAmount?: number;

  @Prop()
  quoteDetails?: string;

  @Prop()
  bookingDate?: Date;

  @Prop()
  notes?: string;

  @Prop({ default: Date.now })
  lastContactDate?: Date;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);

// Indexes
LeadSchema.index({ vendorId: 1 });
LeadSchema.index({ customerId: 1 });
LeadSchema.index({ status: 1 });
LeadSchema.index({ createdAt: -1 });
