import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ContactInfoDocs = Document & ContactInfo;

@Schema()
export class ContactInfo extends Document {
  @Prop() phone: string;
  @Prop() linkedInUrl: string;
  @Prop() websiteUrl: string;
  @Prop() facebookUrl: string;
  @Prop() github: string;
  @Prop() behnance: string;
  // other field incase frontend feels like adding more
  @Prop({ type: [Object], default: [] }) other: Record<string, string>[];
}

export const ContactInfoSchema = SchemaFactory.createForClass(ContactInfo);
