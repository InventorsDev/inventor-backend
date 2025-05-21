import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TokenDocument = InviteToken & Document;

@Schema({ timestamps: true })
export class InviteToken {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ required: true })
  used: boolean;
}

export const InviteTokenSchema = SchemaFactory.createForClass(InviteToken);
