import { Prop, Schema, raw, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  Contact,
  ContactRawSchema,
  Socials,
  SocialsRawSchema,
  UserStatus,
  UserRole,
  RegistrationMethod,
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
import { UserInviteDto } from 'src/users/dto/user-invite.dto';

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

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.statics.sendEmailVerificationToken =
  async function sendEmailVerificationToken(req: ApiReq, userId: string) {
    const user = await this.findById(new Types.ObjectId(userId), {
      email: 1,
      firstName: 1,
    });
    const emailVerificationKey = `inventors:users:email:verification:${userId}`;
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
  const emailVerificationKey = `inventors:users:email:verification:${userId}`;
  const tokenDetails = await redisGet(emailVerificationKey);
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

  console.log('Password', newPassword, password);

  sendMail({
    to: user.email,
    from: EmailFromType.HELLO,
    subject: 'Reset Your Password - Action Required',
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
  createUserDto: CreateUserDto | UserInviteDto,
  sso: boolean = false,
) {

  let generatePassword: string;
  if ('password' in createUserDto) {
    const createUserDtoWithType = createUserDto as CreateUserDto;
    generatePassword = createUserDtoWithType.password.trim();
  } else {
    generatePassword = faker.internet.password({length: 5}) + '$?wE';
  }
  passwordMatch(generatePassword);

  const password = await BcryptUtil.generateHash(generatePassword);
  const email = createUserDto.email.trim().toLowerCase();

  const existingUser = await this.findOne({ email }, { _id: 1 });
  if (existingUser)
    throw new BadRequestException(
      'User already exists.',
    );

  const data: any = {
    ...createUserDto,
    firstName: firstCapitalize(createUserDto.firstName.trim()),
    lastName: firstCapitalize(createUserDto.lastName.trim()),
    email,
    password,
    role: [ UserRole.USER ],
  };

  if(req.query.invitation === RegistrationMethod.INVITATION){
    data.pendingInvitation = true;
  }

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
    subject: 'Welcome to Our Developer Community at Inventors!',
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
