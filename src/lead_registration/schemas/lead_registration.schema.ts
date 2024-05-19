import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// export type RegistrationDocument = Registration & Document;

@Schema()
export class Registration extends Document{
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  role: string;

  @Prop({ required: true, enum: ['pending', 'approved', 'rejected'] })
  status: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const RegistrationSchema = SchemaFactory.createForClass(Registration);