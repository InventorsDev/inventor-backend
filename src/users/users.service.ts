import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { Model, Types } from 'mongoose';
import { faker } from '@faker-js/faker';
import { UserChangePasswordDto } from './dto/user-change-password.dto';
import { UserAddPhotoDto } from './dto/user-add-photo.dto';
import { User, UserDocument } from 'src/shared/schema';
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
import {
  ApiReq,
  ApplicationStatus,
  EmailFromType,
  UserRole,
  UserStatus,
} from 'src/shared/interfaces';
import { UserInviteDto } from './dto/user-invite.dto';
import { format } from 'date-fns';
import { CreateUserDto } from 'src/shared/dtos/create-user.dto';
// import { VerificationStatus } from 'src/shared/interfaces/user.type';
import {} from 'src/shared/configs';
@Injectable()
export class UsersService {
  private readonly baseUrl = 'http://localhost:3888/docs/api/v1/leads';
  constructor(
    @Inject(User.name)
    private readonly userModel: Model<UserDocument>,
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
      firstName: firstCapitalize(payload.firstName.trim()),
      lastName: firstCapitalize(payload.lastName.trim()),
      password,
      email,
      emailVerification: true,
      roles: [...new Set([...payload.roles, UserRole.USER])],
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

    // sendMail({
    //   to: user.email,
    //   from: EmailFromType.HELLO,
    //   subject: 'Password Change',
    //   template: getMailTemplate().generalPasswordChange,
    //   templateVariables: {
    //     password: newPassword,
    //     firstName: user.firstName,
    //     email: user.email,
    //   },
    // });
    sendMail({
      to: user.email,
      from: EmailFromType.HELLO,
      subject: 'Passsword change',
      template: getMailTemplate().generalPasswordChange,
      templateVariables: {
        password: newPassword,
        firstName: user.firstName,
        email: user.email,
      },
    });

    // return this.userModel
    //   .findOneAndUpdate(
    //     { _id: user._id },
    //     { $set: { password } },
    //     {
    //       new: true,
    //       lean: true,
    //     },
    //   )
    //   .select('email firstName lastName');
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
      .find({ applicationStatus: ApplicationStatus.PENDING })
      .exec();
    if (!leadApplications) {
      throw new NotFoundException('No application data found!');
    }
    return leadApplications;
  }

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
    console.log(
      `Email: ${email}\nUser: ${user}\nUser status: ${user.applicationStatus}`,
    );
    sendMail({
      to: user.email,
      from: EmailFromType.HELLO,
      subject: 'Lead Registration',
      template: getMailTemplate().generalLeadRegistration,
      templateVariables: {
        firstName: user.firstName,
        position: leadPosition,
      },
    });
    console.log(`email sent to ${user}`);
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
    userApplication.role = [UserRole.LEAD];
    userApplication.applicationStatus = ApplicationStatus.APPROVED;
    userApplication.save();

    sendMail({
      to: userApplication.email,
      from: EmailFromType.HELLO,
      subject: 'Application status',
      template: getMailTemplate().leadApplicationStauts,
      templateVariables: {
        status: true,
        firstName: userApplication.firstName,
        email: userApplication.email,
      },
    });
    return `${userApplication.firstName} has been verified as a lead for ${userApplication.leadPosition}`;
  }

  // reject a lead application
  async rejectTempApplication(email: string, message: string): Promise<User> {
    const userApplication = this.viewOneApplication(email);
    (await userApplication).leadPosition = '';
    (await userApplication).applicationStatus = ApplicationStatus.REJECTED;
    (await userApplication).save();

    sendMail({
      to: email,
      from: EmailFromType.HELLO,
      subject: 'LEAD APPLICATION STATUS',
      template: getMailTemplate().generalLeadRegistration,
      templateVariables: {
        email: email,
        message: `Thank you for your intrest in becoming a lead in the inventors community. Unfortunately, you applcation has been declined \n${message}`,
      },
    });
    return userApplication;
  }

  // generate encrypted links
  async inviteLead(email: string): Promise<string> {
    const user = await this.userModel.findOne({ email: email });
    const preFilledParams = {
      userId: user ? user._id : '',
      email: email,
      firstName: user ? user.firstName : '',
      lastName: user ? user.lastName : '',
    };

    const queryString = new URLSearchParams(preFilledParams as any).toString();
    // console.log(`Query string: ${queryString}`);
    const encryptedParams = encrypt(queryString);
    const fullLink = `${this.baseUrl}/invite-link?data=${encodeURIComponent(encryptedParams)}`;
    // TODO create ivite lead template
    sendMail({
      to: email,
      from: EmailFromType.HELLO,
      subject: 'BECOME ONE OF OUR LEADS - INVENTORS',
      template: getMailTemplate().generalLeadRegistration,
      templateVariables: {
        email: user.email,
        link: fullLink,
        firstName: user.firstName,
      },
    });
    console.log(fullLink);
    return 'Invite link sent';
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
  // decided to go the crude way since i couldn't get the one in here to work
  async getUsersWithLeadRole(): Promise<User[]> {
    const users = await this.userModel.find({ role: 'LEAD' }).exec();
    return users;
  }

  // refrence routing a new user
  async createUser(userData: CreateUserDto) {
    return (this.userModel as any).signUp(userData);
  }

  async requestVerification(req: ApiReq, userId: string) {
    //1. Retrieve user information and check that user exists
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    //2. Check that current date > nextRequestVerificationDate
    const currentDate = new Date();
    if (
      user.nextVerificationRequestDate &&
      currentDate < user.nextVerificationRequestDate
    ) {
      throw new Error('Verification request not allowed at this time');
    }

    //3. Check that the user verification status is not verified
    if (user.applicationStatus === ApplicationStatus.APPROVED) {
      throw new Error('User is already verified');
    }

    //4. Update user verification status and next verification date to 3 months from now
    user.applicationStatus = ApplicationStatus.PENDING;
    const nextVerificationDate = new Date();
    nextVerificationDate.setMonth(nextVerificationDate.getMonth() + 3);
    user.nextVerificationRequestDate = nextVerificationDate;

    //5. Save the updated user
    await user.save();
  }
}
