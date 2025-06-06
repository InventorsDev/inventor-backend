import { faker } from '@faker-js/faker';
import { BadRequestException } from '@nestjs/common';
import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Mongoose, Types } from 'mongoose';
import { CreateUserDto } from '../dtos/create-user.dto';
import { ApiReq, EmailFromType } from '../interfaces';
import {
  ApplicationStatus,
  RegistrationMethod,
  Socials,
  SocialsRawSchema,
  UserRole,
  UserStatus,
} from '../interfaces/user.type';
import {
  BcryptUtil,
  firstCapitalize,
  getBaseUrlWithPath,
  mailTemplates,
  passwordMatch,
  redisGet,
  redisSet,
  sendMail,
} from '../utils';

export type UserDocument = HydratedDocument<User>;
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, index: true, unique: true }) email: string;

  @Prop({ required: true }) password: string;

  @Prop({ index: true, unique: true, required: true }) userHandle: string;

  @Prop({
    index: true,
    default: [UserRole.USER],
  })
  role: UserRole[];

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

  // put this into a diff collectiona nd grab data from that
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'BasicInfo' })
  basicInfo: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'ProfessionalInfo' })
  professionalInfo: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'ContactInfo' })
  contactInfo: mongoose.Types.ObjectId;

  @Prop({ index: true })
  deviceId: string;

  @Prop({ index: true })
  deviceToken: string;

  @Prop({ required: false })
  leadPosition: string; // sole purpose of identifying leads || maybe change this into types

  @Prop({ index: true, required: false })
  applicationStatus: ApplicationStatus;

  @Prop({ required: false })
  nextApplicationTime: Date;

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

  @Prop({ type: Date })
  nextVerificationRequestDate: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.statics.sendEmailVerificationToken =
  async function sendEmailVerificationToken(req: ApiReq, userId: string) {
    const user = await this.findById(new Types.ObjectId(userId))
      .select('email basicInfo')
      .populate({
        path: 'basicInfo',
        select: 'firstname',
      });

    if (!user) throw new BadRequestException('User not found');
    const firstName = user.basicInfo?.firstName || '[name]';
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
      template: mailTemplates.emailVerification,
      templateVariables: {
        firstName,
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
  const sanitizedEmail = decodeURIComponent(email.trim()).toLowerCase();

  const user = await this.findOne({ email: sanitizedEmail })
    .select('_id email password basicInfo')
    .populate({
      path: 'basicInfo',
      select: 'firstName',
    });

  if (!user) throw new BadRequestException('Email Not Registered to Any User');

  const newPassword =
    faker.internet.password({
      length: 8,
      memorable: false,
      pattern: /[A-Za-z0-9]/,
    }) + '$?wE';
  const password = await BcryptUtil.generateHash(newPassword);

  const firstName = user.basicInfo?.firstName || '[name]';

  console.log('Password', newPassword, password);
  console.log('firstName: ', firstName);

  // save the password
  user.password = password;
  await user.save();

  // sennd reset mail
  sendMail({
    to: user.email,
    from: EmailFromType.HELLO,
    subject: 'Reset Your Password - Action Required',
    template: mailTemplates.passwordChangedNotification,
    templateVariables: {
      name: firstName,
    },
  });

  return {
    email: user.email,
    firstName,
    message: 'password successfully changed',
  };
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
  injectedModels: {
    BasicInfoModel: typeof mongoose.Model<any>;
    ProfessionalInfoModel: typeof mongoose.Model<any>;
    ContactInfoModel: typeof mongoose.Model<any>;
  },
) {
  if (!injectedModels) throw new BadRequestException('Models not provided');

  const { BasicInfoModel, ProfessionalInfoModel, ContactInfoModel } =
    injectedModels;

  const email = createUserDto.email.trim().toLowerCase();
  const existingUser = await this.findOne({ email }, { _id: 1 });
  if (existingUser) throw new BadRequestException('User already exists.');

  let generatePassword: string;
  if ('password' in createUserDto) {
    const createUserDtoWithType = createUserDto as CreateUserDto;
    generatePassword = createUserDtoWithType.password.trim();
  } else {
    generatePassword = faker.internet.password({ length: 5 }) + '$?wE';
  }
  passwordMatch(generatePassword);
  const password = await BcryptUtil.generateHash(generatePassword);

  const { email: m_email, ...rest } = createUserDto;
  if ('password' in rest) {
    delete rest.password;
  }

  // createnig subdocs
  const basic_info = await BasicInfoModel.create({
    firstName: firstCapitalize(createUserDto.firstName.trim()),
    lastName: firstCapitalize(createUserDto.lastName.trim()),
  });
  const professional_info = await ProfessionalInfoModel.create({});
  const contact_info = await ContactInfoModel.create({});

  // create user
  const data: any = {
    email,
    password,
    role: [UserRole.USER],
    location: createUserDto.location,
    joinMethod: createUserDto.joinMethod || RegistrationMethod.SIGN_UP,
    basicInfo: basic_info._id,
    professionalInfo: professional_info._id,
    contactInfo: contact_info._id,
  };

  if (req.query.invitation === RegistrationMethod.INVITATION) {
    data.pendingInvitation = true;
  }
  data.userHandle = await (this as any).generateUserHandle(email);

  // create the new data on the db
  const record = await this.create(data);

  // coonfirm that the data was created and fetch that data (along with verify token response)
  const [details, user] = await Promise.all([
    sso
      ? []
      : (this as any).sendEmailVerificationToken(req, record._id.toString()),
    this.findById(record._id.toString())
      .populate('basicInfo professionalInfo contactInfo')
      .lean(), // using lean for plain js object
  ] as any);

  sendMail({
    to: data.email,
    from: EmailFromType.HELLO,
    subject: 'Welcome to Our Developer Community at Inventors!',
    template: mailTemplates.generalSignUp,
    templateVariables: {
      name: data.basic_info.firstName,
    },
  });

  return { ...details, ...user };
};
