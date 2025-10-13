import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InquiryDocument = Inquiry &
  Document<Types.ObjectId> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };

export enum InquiryStatus {
  PENDING = 'pending',
  REPLIED = 'replied',
  CLOSED = 'closed',
}

@Schema({ timestamps: true })
export class InquiryMessage {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ required: true })
  message: string;

  @Prop([String])
  attachments?: string[];

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt?: Date;
}

@Schema({ timestamps: true })
export class Inquiry {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true })
  vendorId: Types.ObjectId;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  message: string;

  @Prop([String])
  attachments?: string[];

  @Prop({ enum: InquiryStatus, default: InquiryStatus.PENDING })
  status: InquiryStatus;

  @Prop([InquiryMessage])
  messages: InquiryMessage[];

  @Prop()
  weddingDate?: Date;

  @Prop()
  guestCount?: number;

  @Prop()
  budget?: number;

  @Prop()
  venue?: string;

  @Prop()
  specialRequirements?: string;

  @Prop()
  preferredContactMethod?: string;

  @Prop()
  urgency?: 'low' | 'medium' | 'high';

  @Prop()
  lastMessageAt?: Date;

  @Prop()
  closedAt?: Date;

  @Prop()
  closedBy?: Types.ObjectId;

  @Prop()
  closedReason?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const InquirySchema = SchemaFactory.createForClass(Inquiry);
