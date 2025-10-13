import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SuperAdminDocument = SuperAdmin &
  Document<Types.ObjectId> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class SuperAdmin {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  phone?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop()
  profileImage?: string;

  // Super admin specific fields
  @Prop({ default: true })
  canManageUsers: boolean;

  @Prop({ default: true })
  canManageVendors: boolean;

  @Prop({ default: true })
  canManageContent: boolean;

  @Prop({ default: true })
  canViewAnalytics: boolean;

  @Prop({ default: true })
  canManageSystemSettings: boolean;
}

export const SuperAdminSchema = SchemaFactory.createForClass(SuperAdmin);
