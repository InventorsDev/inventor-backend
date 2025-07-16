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
import { Model } from 'mongoose';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UserLoginDto } from '../dtos/user-login.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
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

  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Registers a new user. Requires a valid email and password.\n' +
      "Also requires the user's first and last name, a valid join\n" +
      " method, the user's location (latitude and longitude), \n" +
      'and their device details (ID and token).',
  })
  @Post('register')
  register(@Request() req: ApiReq, @Body() createAuthDto: CreateUserDto) {
    return (this.userModel as any).signUp(req, createAuthDto, false, {
      BasicInfoModel: this.basicInfoModel,
      ProfessionalInfoModel: this.professionalInfoModel,
      ContactInfoModel: this.contactInfoModel,
    });
  }

  @UseGuards(LocalUsersGuard)
  @ApiOperation({
    summary: 'Login a user',
    description:
      'Login a user into the system. This will return a JWT token. It requires a valid email and password.',
  })
  @Post('login')
  login(@Request() req, @Body() userLoginDto: UserLoginDto) {
    return this.authService.login(req);
  }

  @ApiOperation({
    summary: 'Verify a user',
    description: 'Verify a user. This requires a valid userId and token.',
  })
  @Get('/:userId/verify/:token/email')
  async verifyEmail(
    @Param('userId') userId: string,
    @Param('token') token: string,
  ) {
    return (this.userModel as any).verifyEmail(userId, token);
  }

  @ApiOperation({
    summary: 'Resend user verification email',
    description:
      'Resends the user verification email. This requires a valid email.',
  })
  @Post('resend/:email/verification')
  async resendVerification(
    @Request() req: ApiReq,
    @Param('email') email: string,
  ) {
    return this.authService.resendVerificationLink(req, email);
  }

  @ApiBearerAuth()
  @UseGuards(JwtUsersGuard)
  @ApiOperation({
    summary: 'Send email verification token',
    description: 'Sends an email verification token to the user.',
  })
  @Post('/:userId/email-verification')
  async sendEmailVerificationToken(
    @Request() req: ApiReq,
    @Param('userId') userId: string,
  ) {
    return this.authService.sendEmailVerificationToken(req, userId);
  }

  @ApiOperation({
    summary: 'Forget password',
    description:
      'Trigger the flow for a forgotten password. This requires a valid email, and will send an email to the user.',
  })
  @Post('/:email/forget-password')
  async forgetPassword(@Param('email') email: string) {
    return (this.userModel as any).forgetPassword(email);
  }
}
