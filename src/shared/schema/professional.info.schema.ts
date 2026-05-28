import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProfessionalInfoDocs = Document & ProfessionalInfo;

@Schema()
export class ProfessionalInfo extends Document {
  @Prop() jobTitle: string;
  @Prop() company: string;
  @Prop() yearsOfExperience: number;
  @Prop() school: string;
  @Prop() primarySkill: string;
  @Prop() secondarySkill: string;
  @Prop([String]) technologies: string[];
  @Prop([String]) interestAreas: string[];
}

export const ProfessionalInfoSchema =
  SchemaFactory.createForClass(ProfessionalInfo);
