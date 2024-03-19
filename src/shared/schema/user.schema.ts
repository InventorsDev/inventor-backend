import { Prop, Schema, raw, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  Contact,
  ContactRawSchema,
  Socials,
  SocialsRawSchema,
  UserStatus,
  UserRole,
} from '../interfaces/user.type';
import { ApiReq, EmailFromType } from '../interfaces';
import { faker } from '@faker-js/faker';
import {
  BcryptUtil,
  firstCapitalize,
  getBaseUrlWithPath,
  getMailTemplate,
  passwordMatch,
  redisGet,
  redisSet,
  sendMail,
} from '../utils';
import { BadRequestException } from '@nestjs/common';
import { CreateUserDto } from '../dtos/create-user.dto';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ index: true })
  firstName: string;

  @Prop({ index: true })
  lastName: string;

  @Prop({ required: true, index: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  profileSummary: string;

  @Prop({ required: true })
  jobTitle: string;

  @Prop({ required: true })
  currentCompany: string;

  @Prop()
  photo: string;

  @Prop()
  age: number;

  @Prop({ index: true })
  phone: string;

  @Prop({ index: true, unique: true })
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
      required: true,
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
    default: UserRole.USER,
  })
  role: UserRole;

  @Prop({
    index: true,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Prop({ index: true, default: false })
  emailVerification: boolean;

  @Prop({ type: [raw(ContactRawSchema)], default: [] })
  contacts: Contact;

  @Prop(raw(SocialsRawSchema))
  socials: Socials;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.statics.sendEmailVerificationToken =
  async function sendEmailVerificationToken(req: ApiReq, userId: string) {
    const user = await this.findById(new Types.ObjectId(userId), {
      email: 1,
      firstName: 1,
    });
    const emailVerificationKey = `watche:users:email:verification:${userId}`;
    const token = faker.datatype.number({ min: 100_000, max: 999_999 });
    await redisSet(
      emailVerificationKey,
      { userId, token },
      { EX: 24 * 3600 * 30 },
    );

    const emailVerificationUrl = getBaseUrlWithPath(
      req,
      `api/v1/auth/${userId}/verify/${token}/email`,
    );
    sendMail({
      to: user.email,
      from: EmailFromType.HELLO,
      subject: 'Important - Email Confirmation Code',
      template: getMailTemplate().generalEmailVerification,
      templateVariables: {
        userId: user?._id?.toString(),
        firstName: user.firstName,
        email: user.email,
        emailVerificationUrl,
        emailVerificationCode: token,
      },
    });

    return { emailVerificationCode: token, emailVerificationUrl };
  };

UserSchema.statics.verifyEmail = async function verifyEmail(userId, token) {
  const emailVerificationKey = `watche:users:email:verification:${userId}`;
  const tokenDetails = await redisGet(emailVerificationKey);
  console.log('TOKEN-DETAILS', tokenDetails);
  if (tokenDetails?.token?.toString() === token) {
    await this.updateOne(
      { _id: new Types.ObjectId(tokenDetails.userId) },
      {
        $set: {
          emailVerification: true,
        },
      },
    );
    return { status: 200, message: 'Email Verification Successful' };
  }
  throw new BadRequestException(
    'Invalid email verification token supplied. Try again',
  );
};

UserSchema.statics.forgetPassword = async function forgetPassword(
  email: string,
) {
  const user = await this.findOne(
    { email: decodeURIComponent(email.trim()).toLowerCase() },
    {
      _id: 1,
      firstName: 1,
      password: 1,
      email: 1,
    },
  );

  if (!user)
    throw new BadRequestException(
      'Email supplied cannot be found to effect password change.',
    );

  const newPassword = faker.internet.password(5) + '$?wE';
  const password = await BcryptUtil.generateHash(newPassword);

  sendMail({
    to: user.email,
    from: EmailFromType.HELLO,
    subject: 'Password Change',
    template: getMailTemplate().generalPasswordChange,
    templateVariables: {
      password: newPassword,
      firstName: user.firstName,
      email: user.email,
    },
  });

  return this.findOneAndUpdate(
    { _id: user._id },
    { $set: { password } },
    {
      new: true,
      lean: true,
    },
  ).select('email firstName lastName');
};

UserSchema.statics.generateUserHandle = async function generateUserHandle(
  username: string,
) {
  const pos = username.indexOf('@');
  let _userHandle = username.substring(0, pos).replace(/@/g, '').trim();
  const userHandles = await this.find(
    { userHandle: { $regex: _userHandle, $options: 'i' } },
    { userHandle: 1 },
  );
  if (userHandles.length > 0) {
    _userHandle +=
      _userHandle.length +
      faker.datatype.number({
        min: userHandles.length + 1,
        max: 100_000,
      });
  }
  return _userHandle.replace(/@/g, '').trim().toLowerCase();
};

UserSchema.statics.signUp = async function signUp(
  req: ApiReq,
  createUserDto: CreateUserDto,
  sso: boolean = false,
) {
  passwordMatch(createUserDto.password.trim());
  const password = await BcryptUtil.generateHash(createUserDto.password.trim());
  const email = createUserDto.email.trim().toLowerCase();

  const existingUser = await this.findOne({ email }, { _id: 1 });
  if (existingUser)
    throw new BadRequestException(
      'User already exists. Sign into your account',
    );

  const data: any = {
    ...createUserDto,
    firstName: firstCapitalize(createUserDto.firstName.trim()),
    lastName: firstCapitalize(createUserDto.lastName.trim()),
    email,
    password,
    type: UserRole.USER,
  };
  data.userHandle = await (this as any).generateUserHandle(email);
  const record = await this.create(data);
  const [details, user] = await Promise.all([
    sso
      ? []
      : (this as any).sendEmailVerificationToken(req, record._id.toString()),
    this.findById(record._id.toString()),
  ] as any);

  sendMail({
    to: data.email,
    from: EmailFromType.HELLO,
    subject: 'Step into Secure Horizons: Welcome to Routewatche!',
    template: getMailTemplate().generalSignUp,
    templateVariables: {
      firstName: data.firstName,
      lastName: user.lastName,
      phoneNumber: user.phone,
      email: data.email,
    },
  });

  return { ...details, ...user };
};
