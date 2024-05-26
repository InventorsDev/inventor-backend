import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { UserRole } from "../interfaces";

@Schema()
export class TempLeadRegistration extends Document { 
  @Prop ({required: true})
  email: string;

  @Prop ({required: true})
  role:string = UserRole.LEAD;

  @Prop ({required: true})
  CreatedAt: Date;

  @Prop ({required: true})
  userId: string;

  @Prop ({required: true})
  leadPosition: string;
}
export const TempLeadRegistrationSchema = SchemaFactory.createForClass(TempLeadRegistration);