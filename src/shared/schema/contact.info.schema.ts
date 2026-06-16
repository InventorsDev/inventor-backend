// Embedded sub-document holding user contact info
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class ContactInfo {
  @Prop() phone: string;
  @Prop() linkedInUrl: string;
  @Prop() websiteUrl: string;
  @Prop() facebookUrl: string;
  @Prop() twitterUrl: string;
  @Prop() github: string;
  @Prop() behnance: string;
  // other field incase frontend feels like adding more
  @Prop({ type: [Object], default: [] }) other: Record<string, string>[];
}

export const ContactInfoSchema = SchemaFactory.createForClass(ContactInfo);
