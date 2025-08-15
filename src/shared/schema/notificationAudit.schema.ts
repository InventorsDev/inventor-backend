import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { NotificationType } from '../interfaces';

export type NotificationAuditInfoDoc = HydratedDocument<NotificationAuditInfo>;

@Schema({ collection: 'notification_audit', timestamps: true })
export class NotificationAuditInfo {
  @Prop({ required: true })
  actorId: string; // id of the admin who made the change

  @Prop({ required: true })
  resolutionMessage: string;

  @Prop({ required: true, type: String, enum: ['REJECTED', 'APPROVED'] })
  resolutionStatus: string;

  @Prop({ required: true, type: String, enum: NotificationType })
  entityType: NotificationType;

  @Prop({ required: true })
  entityId: string;

  @Prop({ required: true })
  notificationSummary: string;
}

export const NotificationAuditSchema = SchemaFactory.createForClass(
  NotificationAuditInfo,
);
