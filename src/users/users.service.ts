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
  addPhotos,
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
  EmailFromType,
  UserRole,
  UserStatus,
} from 'src/shared/interfaces';
import { UserInviteDto } from './dto/user-invite.dto';

@Injectable()
export class UsersService {
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
}
