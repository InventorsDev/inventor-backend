import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Status, } from '../interfaces/post.type';
import { IsArray, IsString } from 'class-validator';

export type PostDocument = HydratedDocument<Post>;

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true, index: true })
  title: string; 

  @Prop({ required: true })
  shortDesc: string; 

  @Prop({ required: true })
  description: string;

  @Prop()
  photo: string;

  @Prop({ type: Date, index: true })
  blogDate: Date;

  @Prop({ enum: Status, default: Status.PENDING, index: true })
  status: Status;
}

export const PostSchema = SchemaFactory.createForClass(Post);