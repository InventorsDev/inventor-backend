import { faker } from '@faker-js/faker';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { format } from 'date-fns';
import { link } from 'fs';
import { Exception } from 'handlebars';
import { Model, Types } from 'mongoose';
import {} from 'src/shared/configs';
import { CreateUserDto } from 'src/shared/dtos/create-user.dto';
import {
  ApiReq,
  ApplicationStatus,
  EmailFromType,
  RegistrationMethod,
  UserRole,
  UserStatus,
  userStatuses,
} from 'src/shared/interfaces';
import {
  BasicInfo,
  ContactInfo,
  ProfessionalInfo,
  User,
  UserDocument,
} from 'src/shared/schema';
import {
  InviteToken,
  TokenDocument,
} from 'src/shared/schema/invite-tokens.schema';
import {
  BcryptUtil,
  CloudinaryFolders,
  decrypt,
  encrypt,
  firstCapitalize,
  getMailTemplate,
  getPaginated,
  getPagingParams,
  passwordMatch,
  sendMail,
  uploadToCloudinary,
  verifyHandle,
} from 'src/shared/utils';
import { buffer } from 'stream/consumers';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserAddPhotoDto } from './dto/user-add-photo.dto';
import { UserChangePasswordDto } from './dto/user-change-password.dto';
import { UserInviteDto } from './dto/user-invite.dto';
@Injectable()
export class UsersService {
  private readonly baseUrl = 'http://localhost:3888/docs/api/v1/lead';
  constructor(
    @Inject(User.name)
    private readonly userModel: Model<UserDocument>,
    @Inject(InviteToken.name)
    private readonly inviteTokenModel: Model<TokenDocument>,
    @Inject(BasicInfo.name)
    private readonly basicInfoModel: Model<BasicInfo>,
    @Inject(ProfessionalInfo.name)
    private readonly professionalInfoModel: Model<ProfessionalInfo>,
    @Inject(ContactInfo.name)
    private readonly contactInfoModel: Model<ContactInfo>,
  ) {}

  sendEmailVerificationToken(req: any, userId: string) {
    (this.userModel as any).sendEmailVerificationToken(req, userId);
  }

  private async verifyUserHandle(handle: string, userId: string) {
    verifyHandle(handle);
    const user = await this.userModel.findOne(
      { userHandle: handle.replace(/@/g, '').toLowerCase().trim() },
      { userHandle: 1, _id: 1 },
    );

    if (
      (user !== null || user?.userHandle) &&
      user?._id?.toString() !== userId
    ) {
      throw new BadRequestException('This handle has been taken');
    }
  }

  async userInvite(payload: UserInviteDto): Promise<User> {
    const password = await BcryptUtil.generateHash(
      faker.internet.password(5) + '$?wE',
    );
    const email = payload.email.trim().toLowerCase();
    return this.userModel.create({
      basic_info: {
        firstName: firstCapitalize(payload.firstName.trim()),
        lastName: firstCapitalize(payload.lastName.trim()),
        password,
        email,
        emailVerification: true,
        roles: [...new Set([...payload.roles, UserRole.USER])],
      },
    });
  }

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
      .findOne(new Types.ObjectId(id), project, { lean: true })
      .select('-password')
      .exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const full_user = await this.userModel
      .findById(id)
      .populate('basicInfo')
      .populate('professionalInfo')
      .populate('contactInfo');
    return full_user;
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
    const { firstName, lastName, photo, userHandle } = payload;
    if (photo && !photo.includes('data:image')) {
      throw new BadRequestException('Photo must include a data image');
    }

    const updateData = payload;
    if (firstName) payload.firstName = firstCapitalize(firstName.trim());
    if (lastName) payload.lastName = firstCapitalize(lastName.trim());
    if (userHandle) {
      payload.userHandle = userHandle.toLowerCase().trim().replace(/@/g, '');
      await this.verifyUserHandle(updateData.userHandle, userId);
    }
    // since invited leads join with the pending status, why not auto set status to active once they update
    updateData.status = UserStatus.ACTIVE;

    if (photo) {
      updateData.photo = await uploadToCloudinary(
        photo,
        CloudinaryFolders.PHOTOS,
      );
    }

    return this.userModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(userId) },
        { $set: updateData },
        {
          new: true,
          lean: true,
        },
      )
      .select('-password');
  }

  async addPhoto(userId: string, payload: UserAddPhotoDto): Promise<User> {
    const photo = await uploadToCloudinary(payload.photo);

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
    return await this.userModel
      .findOne(
        { _id: new Types.ObjectId(req.user._id.toString()) },
        {},
        { lean: true },
      )
      .select('-password')
      .exec();
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
      .select('email firstName lastName');
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

  // create lead application for existing user
  // TODO: I think this is unused now
  async createTempRegistration(
    email: string,
    leadPosition: string,
  ): Promise<string> {
    const user = await this.findByEmail(email);
    // check the next application time
    const today = new Date();
    if (user.nextApplicationTime > today) {
      throw new BadRequestException(
        `The next time you can apply as a lead is ${format(user.nextApplicationTime, 'eeee, MMMM do, h:mm a')}`,
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
    let user_details;
    if (user.basicInfo) {
      user_details = await this.basicInfoModel.findById(user.basicInfo).exec();
    }

    await sendMail({
      to: user.email,
      from: EmailFromType.HELLO,
      subject: 'Application Received',
      template: getMailTemplate().generalLeadRegistration,
      templateVariables: {
        firstName: user_details.firstName || '',
        position: leadPosition,
      },
    });
    return 'Application sent';
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
    let user_details;
    try {
      user_details = await this.basicInfoModel.findById(
        userApplication.basicInfo,
      );
    } catch (err) {
      throw new BadRequestException(err, 'The user is not fully registered');
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

  async inviteLead(email: string): Promise<string> {
    if (!email || email === '') {
      throw new BadRequestException('lead email not provided');
    }

    const existing = await this.checkUserExists(email);
    if (existing) {
      throw new BadRequestException('user already exists');
    }
    // create a user (limited information)
    const dummyPassword = await BcryptUtil.generateHash('inventors1234');
    const userHandle = await (this.userModel as any).generateUserHandle(email);
    let token;

    try {
      const newUser = this.userModel.create({
        email: email.toLowerCase(),
        password: dummyPassword,
        firstName: 'placeholder',
        lastName: 'User',
        roles: [UserRole.LEAD],
        joinMethod: RegistrationMethod.INVITATION,
        status: UserStatus.PENDING,
        userHandle,
      });
      console.log('new user: ', newUser);

      // generate token
      token = await this.generateRandomToken(email);
      console.log('token ', token);
    } catch (err) {
      throw new UnprocessableEntityException('failed to register user');
    }

    // add the token as a link
    const invite_link = `${this.baseUrl}/invite/accept?token=${token}`;
    // send mail to user
    await sendMail({
      to: email,
      from: EmailFromType.HELLO,
      subject: 'INVENTORS COMMUNITY: Lead Invitation',
      template: getMailTemplate().generalLeadRegistration,
      templateVariables: {
        link: invite_link,
      },
    });

    return 'invite sent to user';
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

  async validateToken(token: string): Promise<{
    message: string;
    email: string;
  }> {
    const foundToken = await this.inviteTokenModel.findOne({ token });
    // return (
    //   !!foundToken && !foundToken.used && foundToken.expiresAt > new Date()
    // );
    if (!foundToken) {
      throw new BadRequestException('Invalid token expired');
    }
    if (foundToken.used) {
      throw new BadRequestException('Token has already been used');
    }
    if (foundToken.expiresAt < new Date(Date.now())) {
      console.log(`coparing ${foundToken.expiresAt} and ${new Date()}`);
      throw new BadRequestException('Token is expired');
    }

    // mark the token as used
    foundToken.used = true;
    await foundToken.save();

    return {
      message: 'Token valid',
      email: foundToken.email,
    };
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
    const users = await this.userModel.find({ role: 'LEAD' }).exec();
    return users;
  }

  // reference routing a new user
  async createUser(userData: CreateUserDto) {
    return (this.userModel as any).signUp(userData);
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
        firstName: (await this.basicInfoModel.findById(user.basicInfo))
          .firstName,
        nextTryDate: format(user.nextVerificationRequestDate, 'PPPP'),
      },
    });

    return {
      message: 'Verification request sent.',
      nextAllowedRequest: user.nextVerificationRequestDate,
    };
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
