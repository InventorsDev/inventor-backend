// Embedded sub-document holding user professional info
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class ProfessionalInfo {
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
