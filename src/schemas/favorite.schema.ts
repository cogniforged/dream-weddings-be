import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FavoriteDocument = Favorite &
  Document<Types.ObjectId> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class Favorite {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true })
  vendorId: Types.ObjectId;

  @Prop()
  notes?: string;

  @Prop()
  category?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);

// Create compound index to prevent duplicates
FavoriteSchema.index({ userId: 1, vendorId: 1 }, { unique: true });
