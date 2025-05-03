import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UserLoginDto } from '../dtos/user-login.dto';
import { ApiReq } from '../interfaces/req.type';
import {
  BasicInfo,
  BasicInfoDoc,
  ContactInfo,
  ContactInfoDocs,
  ProfessionalInfo,
  ProfessionalInfoDocs,
  User,
  UserDocument,
} from '../schema';
import { AuthService } from './auth.service';
import { JwtUsersGuard } from './guards/jwt.users.guard';
import { LocalUsersGuard } from './guards/local.users.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(User.name)
    private readonly userModel: Model<UserDocument>,
    @Inject(BasicInfo.name)
    private readonly basicInfoModel: Model<BasicInfoDoc>,
    @Inject(ProfessionalInfo.name)
    private readonly professionalInfoModel: Model<ProfessionalInfoDocs>,
    @Inject(ContactInfo.name)
    private readonly contactInfoModel: Model<ContactInfoDocs>,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  register(@Request() req: ApiReq, @Body() createAuthDto: CreateUserDto) {
    return (this.userModel as any).signUp(req, createAuthDto, false, {
      BasicInfoModel: this.basicInfoModel,
      ProfessionalInfoModel: this.professionalInfoModel,
      ContactInfoModel: this.contactInfoModel,
    });
  }

  @UseGuards(LocalUsersGuard)
  @Post('login')
  login(@Request() req, @Body() userLoginDto: UserLoginDto) {
    return this.authService.login(req);
  }

  @Get('/:userId/verify/:token/email')
  async verifyEmail(
    @Param('userId') userId: string,
    @Param('token') token: string,
  ) {
    return (this.userModel as any).verifyEmail(userId, token);
  }

  @Get('resend/:email/verification')
  async resendVerification(
    @Request() req: ApiReq,
    @Param('email') email: string,
  ) {
    return this.authService.resendVerificationLink(req, email);
  }

  @ApiBearerAuth()
  @UseGuards(JwtUsersGuard)
  @Post('/:userId/email-verification')
  async sendEmailVerificationToken(
    @Request() req: ApiReq,
    @Param('userId') userId: string,
  ) {
    return this.authService.sendEmailVerificationToken(req, userId);
  }

  @Post('/:email/forget-password')
  async forgetPassword(@Param('email') email: string) {
    return (this.userModel as any).forgetPassword(email);
  }
}
