import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { UserRole } from '../interfaces/user.type';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true })
  message: string;

  @Prop({ required: false })
  link: string;

  @Prop({
    required: true,
    enum: ['USER', 'ROLE', 'ALL'],
    default: 'USER',
  })
  targetType: 'USER' | 'ROLE' | 'ALL';

  @Prop({
    type: [String],
    default: [],
  })
  targetRoles: UserRole[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  targetUsers: Types.ObjectId[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  readBy: Types.ObjectId[];
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
