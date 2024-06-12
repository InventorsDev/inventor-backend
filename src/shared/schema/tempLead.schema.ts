import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class TempLeadRegistration extends Document { 
  @Prop ({required: true})
  email: string;

  @Prop ({required: true})
  userId: string;

  @Prop ({required: true})
  CreatedAt: Date;

  @Prop ({required: true})
  leadPosition: string;
}
export const TempLeadSchema = SchemaFactory.createForClass(TempLeadRegistration);