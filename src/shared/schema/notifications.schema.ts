import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsBoolean, IsString } from 'class-validator';
import { HydratedDocument, SchemaTypes } from 'mongoose';
import { NotificationType } from '../interfaces';

export type NotificationInfoDoc = HydratedDocument<NotificationInfo>;

@Schema({ timestamps: true })
export class NotificationInfo {
  @Prop({ required: true })
  receiverId: string;

  @Prop({ required: true, type: String, enum: NotificationType })
  notification_type: NotificationType;

  @Prop({ required: true })
  entityId: string;

  @Prop({ required: true })
  @IsString()
  message: string;

  @Prop({ type: SchemaTypes.Mixed }) // ← FIX
  data: Record<string, any>;

  @Prop({ required: true, default: false })
  @IsBoolean()
  isRead: boolean;

  @Prop({ required: true, default: false })
  @IsBoolean()
  isAdminNotification: boolean;
}

export const NotificationSchema =
  SchemaFactory.createForClass(NotificationInfo);
