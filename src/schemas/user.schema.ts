import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  ADMIN = 'admin',
}

export enum VendorCategory {
  PHOTOGRAPHY = 'photography',
  CAKES = 'cakes',
  DECORATIONS = 'decorations',
  VENUES = 'venues',
  BRIDAL_DRESS = 'bridal-dress',
  JEWELRY = 'jewelry',
  CATERING = 'catering',
  MUSIC = 'music',
  WEDDING_CARDS = 'wedding-cards',
  BANDS = 'bands',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop({ default: Date.now })
  lastLogin?: Date;

  // Customer specific fields
  @Prop()
  phone?: string;

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  weddingDate?: Date;

  @Prop()
  budget?: number;

  // Vendor specific fields
  @Prop()
  businessName?: string;

  @Prop({ enum: VendorCategory })
  category?: VendorCategory;

  @Prop()
  businessDescription?: string;

  @Prop()
  businessPhone?: string;

  @Prop()
  businessAddress?: string;

  @Prop()
  businessCity?: string;

  @Prop()
  website?: string;

  @Prop()
  instagram?: string;

  @Prop()
  facebook?: string;

  @Prop()
  whatsapp?: string;

  @Prop({ default: 0 })
  rating?: number;

  @Prop({ default: 0 })
  reviewCount?: number;

  @Prop({ type: Object })
  priceRange?: {
    min: number;
    max: number;
  };

  @Prop({ default: false })
  isPremium?: boolean;

  @Prop({ default: false })
  isFeatured?: boolean;

  @Prop({ default: false })
  isVerified?: boolean;

  @Prop()
  verificationDocuments?: string[];

  @Prop()
  portfolio?: string[];

  @Prop({ type: [Object] })
  packages?: {
    id: string;
    name: string;
    description: string;
    price: number;
    features: string[];
  }[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes for better performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ category: 1 });
UserSchema.index({ businessCity: 1 });
UserSchema.index({ isPremium: 1 });
UserSchema.index({ isFeatured: 1 });
UserSchema.index({ rating: -1 });
UserSchema.index({ createdAt: -1 });
