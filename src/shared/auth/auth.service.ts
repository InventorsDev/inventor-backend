import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { ApiReq, UserStatus } from '../interfaces';
import { User, UserDocument } from '../schema/user.schema';
import { BcryptUtil, firstCapitalize } from '../utils';

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
    const accessToken = this.generateToken(payload);
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

  private generateToken(payload) {
    return {
      access_token: global.jwtService.sign(payload),
    };
  }
}
