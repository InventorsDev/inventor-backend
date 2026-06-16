import { faker } from '@faker-js/faker';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { format } from 'date-fns';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from 'src/shared/dtos/create-user.dto';
import {
  ApiReq,
  ApplicationStatus,
  EmailFromType,
  RegistrationMethod,
  UserRole,
  UserStatus,
} from 'src/shared/interfaces';
import { User, UserDocument } from 'src/shared/schema';
import {
  InviteToken,
  TokenDocument,
} from 'src/shared/schema/invite-tokens.schema';
import {
  BcryptUtil,
  decrypt,
  getMailTemplate,
  getPaginated,
  getPagingParams,
  passwordMatch,
  sendMail,
  uploadToCloudinary,
} from 'src/shared/utils';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserAddPhotoDto } from './dto/user-add-photo.dto';
import { UserChangePasswordDto } from './dto/user-change-password.dto';
import { UserInviteDto } from './dto/user-invite.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(User.name)
    private readonly userModel: Model<UserDocument>,
    @Inject(InviteToken.name)
    private readonly inviteTokenModel: Model<TokenDocument>,
    private readonly configService: ConfigService,
  ) {}

  sendEmailVerificationToken(req: any, userId: string) {
    (this.userModel as any).sendEmailVerificationToken(req, userId);
  }

  // private async verifyUserHandle(handle: string, userId: string) {
  //   verifyHandle(handle);
  //   const user = await this.userModel.findOne(
  //     { userHandle: handle.replace(/@/g, '').toLowerCase().trim() },
  //     { userHandle: 1, _id: 1 },
  //   );
  //
  //   if (
  //     (user !== null || user?.userHandle) &&
  //     user?._id?.toString() !== userId
  //   ) {
  //     throw new BadRequestException('This handle has been taken');
  //   }
  // }

  async findAll(req: ApiReq) {
    const { page, currentLimit, skip, order, dbQuery } = getPagingParams(req);
    const [records, count] = await Promise.all([
      this.userModel
        .find(dbQuery, {}, { lean: true })
        .select('-password')
        .sort({ createdAt: order })
        .allowDiskUse(true)
        .skip(skip)
        .limit(currentLimit),
      this.userModel.countDocuments(dbQuery),
    ] as any);
    return getPaginated<UserDocument>(
      { page, count, limit: currentLimit },
      records,
    );
  }

  async findById(id: string, project: any = {}) {
    const user = await this.userModel
      .findOne({ _id: new Types.ObjectId(id) }, project, { lean: true })
      .select('-password')
      .exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string, project: any = {}): Promise<User> {
    const user = await this.userModel
      .findOne({ email, status: UserStatus.ACTIVE }, project, { lean: true })
      .select('-password')
      .exec();
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  async checkUserExists(email: string) {
    try {
      await this.findByEmail(email);
      return true;
    } catch (err) {
      if (err instanceof NotFoundException) {
        return false;
      }
      throw err;
    }
  }

  async update(userId: string, payload: UpdateUserDto) {
    this.logger.log(`Updating user ${userId}`);
    const user = await this.userModel.findById(userId).select('_id');
    if (!user) throw new NotFoundException('User not Found');

    // All fields live on a single document -> one atomic $set with dot-notation.
    const updates: Record<string, unknown> = {};
    if (payload.email) updates.email = payload.email;
    this.flatten('basicInfo', payload.basic_info, updates);
    this.flatten('professionalInfo', payload.professional_info, updates);
    this.flatten('contactInfo', payload.contact_info, updates);

    let updatedUser: User;
    try {
      updatedUser = await this.userModel
        .findByIdAndUpdate(userId, { $set: updates }, { new: true, lean: true })
        .select('-password');
    } catch (err) {
      this.logger.error(`Failed to update user ${userId}`, err as Error);
      throw new InternalServerErrorException('failed to update user');
    }

    return { message: 'User updated successfully', data: updatedUser };
  }

  // flatten a nested sub-object into dot-notation paths for a partial $set,

  // create lead application for existing user
  async createTempRegistration(
    email: string,
    leadPosition: string,
  ): Promise<string> {
    const user = await this.findByEmail(email);
    // check the next application time
    const today = new Date();
    if (user.nextApplicationTime > today) {
      throw new BadRequestException(
        `Cannot apply until ${format(user.nextApplicationTime, 'eeee, MMMM do, h:mm a')}`,
      );
    }
    // create next application date
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3);
    // update the user data that has to do with application
    try {
      await this.userModel.findOneAndUpdate(
        { email: email },
        {
          $set: {
            applicationStatus: ApplicationStatus.PENDING,
            nextApplicationTime: futureDate,
            leadPosition: leadPosition,
          },
        },
      );
    } catch {
      return 'Error updating user';
    }
    await sendMail({
      to: user.email,
      from: EmailFromType.HELLO,
      subject: 'Application Received',
      template: getMailTemplate().leadApplicationReceived,
      templateVariables: {
        firstName: user.basicInfo?.firstName || '',
        position: leadPosition,
      },
    });
    return 'Application sent';
  }

  async addPhoto(userId: string, payload: UserAddPhotoDto): Promise<User> {
    if (!payload.photo?.includes('data:image')) {
      throw new BadRequestException(
        'photo must be a valid base64 data image string',
      );
    }

    const photo = await uploadToCloudinary(payload.photo);
    if (!photo) {
      throw new BadRequestException('Photo upload failed');
    }

    return this.userModel.findOneAndUpdate(
      { _id: new Types.ObjectId(userId) },
      { $set: { photo } },
      {
        new: true,
        lean: true,
      },
    );
  }

  async remove(id: string) {
    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();
    if (!deletedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return deletedUser;
  }

  async findMe(req: ApiReq): Promise<User> {
    const user = await this.userModel
      .findOne({ _id: new Types.ObjectId(req.user._id.toString()) })
      .select('-password')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User information not found');
    }

    return user;
  }

  async changePassword(
    req: ApiReq,
    userId: string,
    payload: UserChangePasswordDto,
    isAdmin: boolean = false,
  ): Promise<User> {
    const { newPassword, oldPassword, confirmPassword } = payload;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Password do not match');
    }

    passwordMatch(newPassword.trim());

    const user = await this.userModel.findById(new Types.ObjectId(userId), {
      password: 1,
      firstName: 1,
      email: 1,
    });

    if (!user)
      throw new BadRequestException(
        'Email supplied cannot be found to effect password change.',
      );

    if (!isAdmin) {
      const isPasswordMatch = await BcryptUtil.verify(
        oldPassword.trim(),
        user.password as string,
      );
      if (!isPasswordMatch) {
        throw new BadRequestException('Invalid old password supplied.');
      }
    }

    const password = await BcryptUtil.generateHash(payload.newPassword.trim());

    if (isAdmin && req.user._id.toString() !== userId) {
      // Trigger email here
    }

    return this.userModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(userId) },
        { $set: { password } },
        {
          new: true,
          lean: true,
        },
      )
      .select('-password');
  }

  async forgetPassword(email: string) {
    const user = await this.userModel.findOne(
      { email: decodeURIComponent(email.trim()).toLowerCase() },
      {
        _id: 1,
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
        firstName: 'test bot',
        password: newPassword,
        email: user.email,
      },
    });
    return this.userModel
      .findOneAndUpdate(
        { _id: user._id },
        { $set: { password } },
        {
          new: true,
          lean: true,
        },
      )
      .select('email');
  }

  async updateStatus(userId: string, status: UserStatus): Promise<User> {
    return this.userModel
      .findByIdAndUpdate(userId, { status }, { new: true })
      .exec();
  }

  async deactivateAccount(userId: string): Promise<User> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { status: UserStatus.DEACTIVATED },
        { new: true },
      )
      .exec();
  }

  async requestReactivation(userId: string): Promise<User> {
    return this.userModel
      .findByIdAndUpdate(userId, { status: UserStatus.ACTIVE }, { new: true })
      .exec();
  }

  // find one application by email
  async viewOneApplication(email: string): Promise<UserDocument> {
    const application = await this.userModel.findOne({ email }).exec();
    if (!application) {
      throw new NotFoundException(`Application with email ${email} not found`);
    }
    if (application.applicationStatus == ApplicationStatus.PENDING) {
      return application;
    }
    throw new NotFoundException(`${email} has no pendign application`);
  }

  // view all lead applications
  async viewApplications(): Promise<UserDocument[]> {
    const leadApplications = await this.userModel
      .find(
        { applicationStatus: ApplicationStatus.PENDING },
        'email leadPosition',
      )
      .exec();
    if (!leadApplications) {
      throw new NotFoundException('No application data found!');
    }
    return leadApplications;
  }

  // approve a lead application
  async approveTempApplication(email: string): Promise<string> {
    const userApplication = await this.userModel
      .findOne({
        email: email,
        applicationStatus: ApplicationStatus.PENDING,
      })
      .exec();
    if (!userApplication) {
      throw new NotFoundException(`Application for ${email} not found`);
    }
    const user_details = userApplication.basicInfo;
    if (!user_details) {
      throw new BadRequestException('The user is not fully registered');
    }

    userApplication.role = [UserRole.LEAD];
    userApplication.applicationStatus = ApplicationStatus.APPROVED;
    userApplication.save();
    sendMail({
      to: userApplication.email,
      from: EmailFromType.HELLO,
      subject: 'Lead Application Status',
      template: getMailTemplate().leadApplicationStauts,
      templateVariables: {
        firstName: user_details.firstName || '',
        status: true,
        email: userApplication.email,
      },
    });
    return `${user_details.firstName} has been verified as a lead for ${userApplication.leadPosition}`;
  }

  // invite a new user (lead)
  async inviteLead(email: string): Promise<string> {
    if (!email || email === '') {
      throw new BadRequestException('lead email not provided');
    }
    const sanitizedEmail = email.trim().toLowerCase();
    this.logger.log(`Inviting lead ${sanitizedEmail}`);

    const existing = await this.userModel
      .findOne({ email: sanitizedEmail }, { _id: 1 })
      .lean()
      .exec();
    if (existing) {
      throw new BadRequestException('user already exists');
    }
    // create a user (limited information) with empty embedded profile
    const dummyPassword = await BcryptUtil.generateHash(randomBytes(32).toString('hex'));
    const userHandle = await (this.userModel as any).generateUserHandle(
      sanitizedEmail,
    );
    let token: TokenDocument;

    try {
      await this.userModel.create({
        email: sanitizedEmail,
        password: dummyPassword,
        basicInfo: { firstName: '', lastName: '' },
        professionalInfo: { jobTitle: '', company: '', yearsOfExperience: 0 },
        contactInfo: { other: [] },
        role: [UserRole.LEAD],
        joinMethod: RegistrationMethod.INVITATION,
        status: UserStatus.PENDING,
        userHandle,
      });

      token = await this.generateRandomToken(sanitizedEmail);
    } catch (err) {
      this.logger.error(
        `Failed to register lead ${sanitizedEmail}`,
        err as Error,
      );
      throw new UnprocessableEntityException('failed to register user');
    }

    // add the token as a link
    const invite_link = `${this.configService.get<string>('BASE_URL')}/users/invite/complete-invite?token=${token.token}`;

    // send mail to user
    await sendMail({
      to: sanitizedEmail,
      from: EmailFromType.HELLO,
      subject: 'INVENTORS COMMUNITY: Lead Invitation',
      template: getMailTemplate().generalLeadRegistration,
      templateVariables: {
        link: invite_link,
      },
    });

    this.logger.log(`Invite sent to ${sanitizedEmail}`);
    return 'invite sent to user';
  }

  // reject a lead application
  async rejectTempApplication(email: string, message: string): Promise<string> {
    const userApplication = this.viewOneApplication(email);
    (await userApplication).leadPosition = '';
    (await userApplication).applicationStatus = ApplicationStatus.REJECTED;
    (await userApplication).save();

    sendMail({
      to: email,
      from: EmailFromType.HELLO,
      subject: 'Lead Application Status',
      template: getMailTemplate().leadApplicationStauts,
      templateVariables: {
        email: email,
        message: `Thank you for your intrest in becoming a lead in inventors community. Unfortunately, your application has been declined \n${message}`,
      },
    });
    return `${email} application has been rejected`;
  }

  // complete profile link
  async completeProfile(data: UserInviteDto, token: string): Promise<string> {
    // Round 1: token validation and password hash are independent
    const [tokenDoc, hashedPassword] = await Promise.all([
      this.inviteTokenModel.findOne({ token }),
      BcryptUtil.generateHash(data.password),
    ]);

    if (!tokenDoc || tokenDoc.used || tokenDoc.expiresAt < new Date()) {
      throw new BadRequestException('Token is invalid or expired');
    }

    // Round 2: user lookup depends on tokenDoc.email
    const user = await this.userModel
      .findOne({ email: tokenDoc.email.toLowerCase() })
      .select('status');

    if (!user || user.status !== UserStatus.PENDING) {
      throw new BadRequestException('No pending user found');
    }

    // Round 3: single atomic doc write (embedded profile) + token burn
    await Promise.all([
      this.userModel.findByIdAndUpdate(user._id, {
        $set: {
          password: hashedPassword,
          role: [UserRole.LEAD],
          status: UserStatus.ACTIVE,
          emailVerification: true,
          joinMethod: RegistrationMethod.INVITATION,
          deviceId: data.deviceId,
          deviceToken: data.deviceToken,
          photo: data.photo,
          'basicInfo.firstName': data.firstName,
          'basicInfo.lastName': data.lastName,
          'basicInfo.gender': data.gender,
          'basicInfo.age': data.age,
          'professionalInfo.jobTitle': data.jobTitle,
          'professionalInfo.company': data.company,
          'professionalInfo.yearsOfExperience': data.yearsOfExperience,
          'professionalInfo.technologies': data.technologies,
          'contactInfo.linkedInUrl': data.linkedinUrl,
          'contactInfo.github': data.githubUrl,
          'contactInfo.phone': data.phone,
        },
      }),
      this.inviteTokenModel.findByIdAndUpdate(tokenDoc._id, { used: true }),
    ]);

    this.logger.log(`Profile completed for ${tokenDoc.email}`);
    return 'profile completed successfully';
  }

  async generateRandomToken(email: string, length: number = 32) {
    const token = Buffer.from(randomBytes(length).toString('hex'));
    const inviteToken = new this.inviteTokenModel({
      email,
      token,
      used: false,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });
    return inviteToken.save();
  }

  // reference routing a new user
  async createUser(req: ApiReq, userData: CreateUserDto) {
    return (this.userModel as any).signUp(req, userData, false);
  }

  // decode invite link
  paraseEncryptedParams(encryptedParams: string): {
    email: string;
    userId: string;
  } {
    const decryptedParams = decrypt(decodeURIComponent(encryptedParams));
    const [userId, email] = decryptedParams
      .split('&')
      .map((param) => param.split('=')[1]);
    return { userId, email };
  }

  // get all leads
  // decided to go the crude way since i couldn't get the function to work without changing it [lean value giving issues]
  async getUsersWithLeadRole(): Promise<User[]> {
    return await this.userModel.find({ role: 'LEAD' }).exec();
  }

  async requestVerification(req: ApiReq, userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const now = new Date();

    if (
      user.nextVerificationRequestDate &&
      now < user.nextVerificationRequestDate
    ) {
      const retryDate = format(user.nextVerificationRequestDate, 'PPPP');
      throw new BadRequestException(
        `You already submitted a request. Try again after ${retryDate}`,
      );
    }

    if (user.applicationStatus === ApplicationStatus.APPROVED) {
      throw new BadRequestException('You are already verified.');
    }

    // Update user state
    user.applicationStatus = ApplicationStatus.PENDING;
    user.nextVerificationRequestDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ); // 30 days later (this was initially 3 months)
    await user.save();

    // Send confirmation to user
    await sendMail({
      to: user.email,
      from: EmailFromType.HELLO,
      subject: 'Your Verification Request Has Been Received',
      template: getMailTemplate().userVerificationAcknowledgement,
      templateVariables: {
        firstName: user.basicInfo?.firstName || '',
        nextTryDate: format(user.nextVerificationRequestDate, 'PPPP'),
      },
    });

    return {
      message: 'Verification request sent.',
      nextAllowedRequest: user.nextVerificationRequestDate,
    };
  }

  // so unspecified sub-fields are preserved.
  private flatten(
    prefix: string,
    source: object | undefined,
    target: Record<string, unknown>,
  ) {
    if (!source) return;
    for (const [key, value] of Object.entries(source)) {
      if (value !== undefined) target[`${prefix}.${key}`] = value;
    }
  }

  // service for testing mail
  pingMail() {
    sendMail({
      to: 'snebo54@gmail.com',
      from: EmailFromType.HELLO,
      subject: 'Mail check',
      template: getMailTemplate().generalLeadRegistration,
      templateVariables: {
        firstName: 'test bot',
        position: 'test-position',
      },
    });
    return true;
  }
}
