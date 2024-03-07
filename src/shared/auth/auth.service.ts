import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AppleAuthUtil, BcryptUtil, GoogleAuthUtil, splitName } from '../utils';
import { User, UserDocument } from '../schema/user.schema';
import { ApiReq, UserStatus } from '../interfaces';
import { JwtService } from '@nestjs/jwt';
import { faker } from '@faker-js/faker';
import { CreateOAUTHUserDto } from '../dtos/create-oauth-user.dto';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    @Inject(User.name)
    private readonly usersModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  sendEmailVerificationToken(req: any, userId: string) {
    (this.usersModel as any).sendEmailVerificationToken(req, userId);
  }

  async findByUsername(
    email: string,
    userType?: string,
    status: UserStatus = UserStatus.ACTIVE,
  ): Promise<any> {
    const query: any = { email: email.toLowerCase().trim(), status };
    if (userType) {
      query.type = userType;
    }

    return this.usersModel.findOne(query);
  }

  async validateUser(email: string, pass: string): Promise<UserDocument | any> {
    const user = await this.findByUsername(email);
    if (!user) return null;
    const isPasswordMatch = await BcryptUtil.verify(
      pass,
      user.password as string,
    );
    delete user.password;
    return isPasswordMatch ? (user as User) : null;
  }

  private mapUserToPayload(user) {
    return {
      _id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  private async createUserAndGeneratePayload(
    email: string,
    firstName: string,
    lastName: string,
  ): Promise<any> {
    const password = faker.internet.password(7) + '-@$?wE';
    const data = {
      email,
      password,
      firstName,
      lastName,
      emailVerification: true,
    } as CreateOAUTHUserDto;
    const newUser = await (this.usersModel as any).signUp({} as ApiReq, data);
    return this.mapUserToPayload(newUser);
  }

  // async signup(req, createUserhDto: CreateUserDto) {
  //   return await this.usersModel.create(createUserhDto);
  // }

  async login(req: ApiReq) {
    const user: User & any = req.user;
    const payload = this.mapUserToPayload(user);
    const accessToken = this.generateToken(payload);
    return { ...accessToken, ...payload };
  }

  async googleOauthLogin(req: ApiReq) {
    const { user } = await GoogleAuthUtil.verifyGoogleToken(req.body.idToken);
    const { firstName, lastName } = splitName(user.name);

    const existingUser = await this.findByUsername(user.email);
    let payload = {};

    if (existingUser && existingUser.email) {
      payload = this.mapUserToPayload(existingUser);
    } else {
      payload = await this.createUserAndGeneratePayload(
        user.email,
        firstName,
        lastName,
      );
    }

    const accessToken = this.generateToken(payload);
    return { accessToken, ...payload };
  }

  async appleOauthLogin(req: ApiReq) {
    if (!req.body.idToken || !req.body.firstName || !req.body.lastName)
      throw new BadRequestException(
        'email, firstName and lastName are required payload for apple login',
      );
    const { email } = await AppleAuthUtil.verifyAppleToken(req.body.idToken);

    const firstName = req.body.firstName;
    const lastName = req.body.lastName;

    const existingUser = await this.findByUsername(email);
    let payload = {};

    if (existingUser && existingUser.email) {
      payload = this.mapUserToPayload(existingUser);
    } else {
      payload = await this.createUserAndGeneratePayload(
        email,
        firstName,
        lastName,
      );
    }

    const accessToken = this.generateToken(payload);
    return { accessToken, ...payload };
  }

  async resendVerificationLink(req: ApiReq, email: string) {
    const user = await this.findByUsername(email);
    if (!user) {
      throw new BadRequestException(
        `Account with email ${email} does not exist`,
      );
    }
    return this.sendEmailVerificationToken(req, user._id);
  }

  private generateToken(payload) {
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
