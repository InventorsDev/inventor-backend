import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RegistrationMethod, UserRole, UserStatus, Socials, SocialsRawSchema } from '../interfaces';

@Schema()
export class Registration extends Document{

  @Prop({index: true, unique: true})
  userId: string

  @Prop({ index: true, unique: true})
  leadPosition: string

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ index: true })
  firstName: string;

  @Prop({ index: true })
  lastName: string;

  @Prop({ required: true, index: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ index: true })
  profileSummary: string;

  @Prop({ index: true })
  jobTitle: string;

  @Prop({ index: true })
  currentCompany: string;

  @Prop()
  photo: string;

  @Prop()
  age: number;

  @Prop({ index: true })
  phone: string;

  @Prop({ index: true, unique: true, required: true })
  userHandle: string;

  @Prop({ index: true })
  gender: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: false,
    },
  })
  location: {
    type: string;
    coordinates: number[];
  };

  @Prop({ index: true })
  deviceId: string;

  @Prop({ index: true })
  deviceToken: string;

  @Prop({
    index: true,
    default: [UserRole.USER],
  })
  role: UserRole[];

  @Prop({
    index: true,
    default: RegistrationMethod.SIGN_UP,
  })
  joinMethod: RegistrationMethod;

  @Prop({
    index: true,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Prop({ index: true, default: false })
  emailVerification: boolean;

  @Prop({ index: true, default: false })
  pendingInvitation: boolean;

  @Prop(raw(SocialsRawSchema))
  socials: Socials;
}
export const RegistrationSchema = SchemaFactory.createForClass(Registration);
