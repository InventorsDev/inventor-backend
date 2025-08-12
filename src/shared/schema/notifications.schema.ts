import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsBoolean, IsString } from 'class-validator';
import { Document, HydratedDocument } from 'mongoose';
import { NotificationType } from '../interfaces';

export type NotificationInfoDoc = HydratedDocument<NotificationInfo>;

@Schema({ timestamps: true })
export class NotificationInfo {
  @Prop({ required: true }) receiverId: string;
  @Prop({ required: true }) type: NotificationType;
  @Prop({ required: true }) entityId: string;
  @Prop({ required: true })
  @IsString()
  message: string;
  @Prop() data: { [key: string]: any };
  @Prop({ required: true, default: false })
  @IsBoolean()
  isRead: boolean;
  @Prop({ required: true, default: false })
  @IsBoolean()
  isAdminNotification: boolean;
}

export const NotificationSchema =
  SchemaFactory.createForClass(NotificationInfo);
