import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { ApiReq, ReqType, UserStatus } from '../interfaces';
import { User, UserDocument } from '../schema/user.schema';
import {
  BcryptUtil,
  firstCapitalize,
  isMobile,
  redisGet,
  redisSet,
} from '../utils';
import { faker } from '@faker-js/faker';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(User.name)
    private readonly usersModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async sendEmailVerificationToken(req: any, userId: string) {
    return await (this.usersModel as any).sendEmailVerificationToken(
      req,
      userId,
    );
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
    if (user.status === UserStatus.DEACTIVATED) return null;

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
      // firstName: firstCapitalize(user.firstName),
      // lastName: firstCapitalize(user.lastName),
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  async login(req: ApiReq) {
    const user: User & any = req.user;
    const payload = this.mapUserToPayload(user);
    const accessToken = this.generateToken(req, payload);
    return { ...accessToken, ...payload };
  }

  async refreshToken(req: ApiReq, refreshToken: RefreshTokenDto) {
    const tokenType = isMobile(req) ? ReqType.MOBILE : ReqType.WEB;
    const oldRefreshKey = `Refresh_token:${tokenType}:${refreshToken}`;
    const tokenData = await redisGet(oldRefreshKey);

    if (!tokenData) {
      throw new BadRequestException('Invalid refresh token supplied.');
    }

    const user: User & any = req.user;

    if (user._id.toString() !== tokenData.userId.toString()) {
      throw new BadRequestException(
        'Invalid user with refresh token supplied.',
      );
    }

    const payload = this.mapUserToPayload(user);
    const accessToken = this.generateToken(req, payload);
    return { ...accessToken, ...payload };
  }

  async resendVerificationLink(req: ApiReq, email: string) {
    const user = await this.findByUsername(email);
    if (!user) {
      throw new BadRequestException(
        `Account with email ${email} does not exist`,
      );
    }
    if (user.emailVerification)
      throw new BadRequestException('email has alredy been verified');

    return await this.sendEmailVerificationToken(req, user._id);
  }

  private generateToken(req, payload) {
    const tokenType = isMobile(req) ? ReqType.MOBILE : ReqType.WEB;
    const refreshToken = faker.string.uuid();
    const refreshKey = `Refresh_token:${tokenType}:${refreshToken}`;
    redisSet(
      refreshKey,
      { status: true, userId: payload._id },
      { EX: 24 * 3600 * 10 },
    ); // 10 days NOTE: This should alway be longer the the token expire time. Code structure will be improved later across board
    return {
      access_token: global.jwtService.sign(payload),
      refresh_token: refreshToken,
    };
  }
}
