import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PortfolioDocument = Portfolio &
  Document<Types.ObjectId> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

@Schema({ timestamps: true })
export class PortfolioItem {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  mediaUrl: string;

  @Prop({ required: true, enum: MediaType })
  mediaType: MediaType;

  @Prop()
  thumbnailUrl?: string;

  @Prop()
  altText?: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;
}

@Schema({ timestamps: true })
export class Portfolio {
  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true })
  vendorId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop()
  category?: string;

  @Prop({ type: [String] })
  tags?: string[];

  @Prop([PortfolioItem])
  items: PortfolioItem[];

  @Prop()
  projectDate?: Date;

  @Prop()
  venue?: string;

  @Prop()
  clientName?: string;

  @Prop()
  budget?: number;

  @Prop()
  duration?: string;

  @Prop()
  teamSize?: number;

  @Prop()
  challenges?: string;

  @Prop()
  solutions?: string;

  @Prop()
  testimonials?: string;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  likeCount: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop()
  featuredAt?: Date;
}

export const PortfolioSchema = SchemaFactory.createForClass(Portfolio);
