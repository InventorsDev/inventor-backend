// Created to store user basic info
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BasicInfoDoc = Document & BasicInfo;

@Schema()
export class BasicInfo extends Document {
  @Prop() firstName: string;
  @Prop() lastName: string;
  @Prop() profileSummary: string;
  @Prop() phoneNumber: number;
  @Prop({ type: Object }) country: { location: string };
  @Prop() city: string;
}

export const BasicInfoSchema = SchemaFactory.createForClass(BasicInfo);
