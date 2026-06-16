// Embedded sub-document holding user basic info
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class BasicInfo {
  @Prop() firstName: string;
  @Prop() lastName: string;
  @Prop() profileSummary: string;
  @Prop() phoneNumber: number;
  @Prop() gender: string;
  @Prop() age: number;
  @Prop({ type: Object }) country: { location: string };
  @Prop() city: string;
}

export const BasicInfoSchema = SchemaFactory.createForClass(BasicInfo);
