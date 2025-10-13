import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PlanningDocument = Planning &
  Document<Types.ObjectId> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };
export type BudgetItemDocument = BudgetItem &
  Document<Types.ObjectId> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };
export type GuestDocument = Guest &
  Document<Types.ObjectId> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };
export type TimelineItemDocument = TimelineItem &
  Document<Types.ObjectId> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };
export type ChecklistItemDocument = ChecklistItem &
  Document<Types.ObjectId> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class BudgetItem {
  @Prop({ required: true })
  category: string;

  @Prop()
  subcategory?: string;

  @Prop({ required: true })
  item: string;

  @Prop({ required: true })
  plannedAmount: number;

  @Prop({ default: 0 })
  actualAmount: number;

  @Prop()
  vendor?: string;

  @Prop()
  notes?: string;

  @Prop({ default: false })
  isPaid: boolean;

  @Prop()
  paidDate?: Date;

  @Prop()
  paymentMethod?: string;

  @Prop({ default: true })
  isActive: boolean;
}

@Schema({ timestamps: true })
export class Guest {
  @Prop({ required: true })
  name: string;

  @Prop()
  email?: string;

  @Prop()
  phone?: string;

  @Prop()
  relationship?: string;

  @Prop()
  category?: string; // family, friends, colleagues, etc.

  @Prop()
  plusOne?: boolean;

  @Prop()
  plusOneName?: string;

  @Prop()
  dietaryRestrictions?: string;

  @Prop()
  mealPreference?: string;

  @Prop()
  seatingGroup?: string;

  @Prop()
  tableNumber?: number;

  @Prop()
  rsvpStatus?: 'pending' | 'confirmed' | 'declined';

  @Prop()
  rsvpDate?: Date;

  @Prop()
  notes?: string;

  @Prop({ default: true })
  isActive: boolean;
}

@Schema({ timestamps: true })
export class TimelineItem {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  dueDate: Date;

  @Prop()
  category?: string;

  @Prop()
  priority?: 'low' | 'medium' | 'high';

  @Prop()
  assignedTo?: string;

  @Prop()
  vendor?: string;

  @Prop()
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';

  @Prop()
  completedDate?: Date;

  @Prop()
  notes?: string;

  @Prop({ default: true })
  isActive: boolean;
}

@Schema({ timestamps: true })
export class ChecklistItem {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop()
  category?: string;

  @Prop()
  priority?: 'low' | 'medium' | 'high';

  @Prop()
  estimatedTime?: string;

  @Prop()
  assignedTo?: string;

  @Prop()
  vendor?: string;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop()
  completedDate?: Date;

  @Prop()
  notes?: string;

  @Prop({ default: true })
  isActive: boolean;
}

@Schema({ timestamps: true })
export class Planning {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  weddingDate: Date;

  @Prop()
  venue?: string;

  @Prop()
  guestCount?: number;

  @Prop()
  budget?: number;

  @Prop()
  style?: string;

  @Prop()
  theme?: string;

  @Prop({ type: [String] })
  colors?: string[];

  @Prop([BudgetItem])
  budgetItems: BudgetItem[];

  @Prop([Guest])
  guests: Guest[];

  @Prop([TimelineItem])
  timeline: TimelineItem[];

  @Prop([ChecklistItem])
  checklist: ChecklistItem[];

  @Prop()
  notes?: string;

  @Prop({ type: [String] })
  inspiration?: string[];

  @Prop({ type: [Object] })
  vendors?: {
    category: string;
    vendorId: Types.ObjectId;
    vendorName: string;
    contact: string;
    notes?: string;
  }[];

  @Prop({ type: Object })
  progress?: {
    budget: number;
    guests: number;
    timeline: number;
    checklist: number;
  };

  @Prop({ default: true })
  isActive: boolean;
}

export const PlanningSchema = SchemaFactory.createForClass(Planning);
export const BudgetItemSchema = SchemaFactory.createForClass(BudgetItem);
export const GuestSchema = SchemaFactory.createForClass(Guest);
export const TimelineItemSchema = SchemaFactory.createForClass(TimelineItem);
export const ChecklistItemSchema = SchemaFactory.createForClass(ChecklistItem);
