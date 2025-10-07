import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FavoriteDocument = Favorite & Document;

@Schema({ timestamps: true })
export class Favorite {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  customerId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  vendorId: Types.ObjectId;

  @Prop({ default: Date.now })
  addedAt: Date;

  @Prop()
  notes?: string;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);

// Compound index to ensure unique customer-vendor pairs
FavoriteSchema.index({ customerId: 1, vendorId: 1 }, { unique: true });
FavoriteSchema.index({ customerId: 1 });
FavoriteSchema.index({ vendorId: 1 });
