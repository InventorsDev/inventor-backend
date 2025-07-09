import { Prop, Schema, raw, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';

export type BlogDocument = HydratedDocument<Blog>;

@Schema({ timestamps: true })
export class Blog {
  @Prop({ index: true, required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ default: [] })
  tags: string[];

  @Prop({ default: null })
  publishedAt: Date;

  @Prop({ type: Number, default: 0 })
  views: number;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Comment' }],
    default: [],
  })
  comments: Comment[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  author: User;
}

export const BlogSchema = SchemaFactory.createForClass(Blog);
