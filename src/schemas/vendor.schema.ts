import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VendorDocument = Vendor &
  Document<Types.ObjectId> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };

export enum VendorStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum VendorCategory {
  PHOTOGRAPHY = 'photography',
  VIDEOS = 'videos',
  CATERING = 'catering',
  DECORATION = 'decoration',
  FLOWERS = 'flowers',
  CAKES = 'cakes',
  CARDS = 'cards',
  VENUES = 'venues',
  MUSIC = 'music',
  TRANSPORT = 'transport',
  BRIDAL_SALONS = 'bridal_salons',
  GROOM_SALONS = 'groom_salons',
  JEWELRY = 'jewelry',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class Vendor {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  businessName: string;

  @Prop()
  businessDescription?: string;

  @Prop([{ type: String, enum: VendorCategory }])
  categories: VendorCategory[];

  @Prop({ required: true })
  district: string;

  @Prop()
  city?: string;

  @Prop()
  address?: string;

  @Prop()
  phone?: string;

  @Prop()
  website?: string;

  @Prop()
  facebook?: string;

  @Prop()
  instagram?: string;

  @Prop()
  businessLogo?: string;

  @Prop()
  coverImage?: string;

  @Prop({ enum: VendorStatus, default: VendorStatus.PENDING })
  status: VendorStatus;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop()
  featuredAt?: Date;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  inquiryCount: number;

  @Prop({ default: 0 })
  bookingCount: number;

  @Prop({ type: Object })
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };

  @Prop({ type: Object })
  availability?: {
    startDate?: Date;
    endDate?: Date;
    workingDays?: string[];
    workingHours?: {
      start: string;
      end: string;
    };
  };

  @Prop()
  languages?: string[];

  @Prop()
  experience?: number; // years of experience

  @Prop()
  teamSize?: number;

  @Prop()
  specializations?: string[];

  @Prop()
  awards?: string[];

  @Prop()
  certifications?: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  rejectionReason?: string;

  @Prop()
  approvedAt?: Date;

  @Prop()
  approvedBy?: Types.ObjectId;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);
