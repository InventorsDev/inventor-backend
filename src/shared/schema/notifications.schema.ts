import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsBoolean, IsString } from 'class-validator';
import { Document, HydratedDocument } from 'mongoose';
import { NotificationType } from '../interfaces';

export type NotificationInfoDoc = HydratedDocument<NotificationInfo>;

@Schema({ timestamps: true })
export class NotificationInfo {
  @Prop({ required: true }) recievierId: string;
  @Prop({ required: true }) type: NotificationType; //TODO: turn this into an enum
  @Prop({ required: true }) entityId: string;
  @Prop({ required: true })
  @IsString()
  message: string;
  @Prop() data: { [key: string]: any };
  @Prop({ required: true, default: false })
  @IsBoolean()
  isRead: boolean;
}

export const NotificationSchema =
  SchemaFactory.createForClass(NotificationInfo);
