import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type IdeaDocument = Idea &
  Document<Types.ObjectId> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };

export enum IdeaType {
  BLOG_POST = 'blog_post',
  GALLERY = 'gallery',
  USER_STORY = 'user_story',
  TUTORIAL = 'tutorial',
  TREND = 'trend',
}

export enum IdeaCategory {
  DECORATION = 'decoration',
  FASHION = 'fashion',
  FOOD = 'food',
  PHOTOGRAPHY = 'photography',
  VENUE = 'venue',
  PLANNING = 'planning',
  BUDGET = 'budget',
  TRADITIONS = 'traditions',
  TRAVEL = 'travel',
  HEALTH = 'health',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class Idea {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  excerpt?: string;

  @Prop({ required: true, enum: IdeaType })
  type: IdeaType;

  @Prop({ required: true, enum: IdeaCategory })
  category: IdeaCategory;

  @Prop([String])
  tags?: string[];

  @Prop([String])
  images?: string[];

  @Prop()
  featuredImage?: string;

  @Prop()
  videoUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  authorId?: Types.ObjectId;

  @Prop()
  authorName?: string;

  @Prop()
  authorRole?: string;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  likeCount: number;

  @Prop({ default: 0 })
  shareCount: number;

  @Prop({ default: 0 })
  commentCount: number;

  @Prop({ default: true })
  isPublished: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop()
  featuredAt?: Date;

  @Prop()
  publishedAt?: Date;

  @Prop()
  seoTitle?: string;

  @Prop()
  seoDescription?: string;

  @Prop([String])
  seoKeywords?: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  readingTime?: number; // in minutes

  @Prop()
  difficulty?: 'beginner' | 'intermediate' | 'advanced';

  @Prop({ type: Object })
  estimatedCost?: {
    min: number;
    max: number;
    currency: string;
  };

  @Prop()
  timeRequired?: string;

  @Prop({ type: [String] })
  materials?: string[];

  @Prop({ type: [String] })
  steps?: string[];

  @Prop({ type: [String] })
  tips?: string[];

  @Prop({ type: [Types.ObjectId] })
  relatedIdeas?: Types.ObjectId[];

  @Prop()
  location?: string;

  @Prop()
  season?: string;

  @Prop()
  weddingSize?: string;
}

export const IdeaSchema = SchemaFactory.createForClass(Idea);
