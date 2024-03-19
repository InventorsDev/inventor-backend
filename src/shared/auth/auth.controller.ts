import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiReq } from '../interfaces/req.type';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UserLoginDto } from '../dtos/user-login.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LocalUsersGuard } from './guards/local.users.guard';
import { JwtUsersGuard } from './guards/jwt.users.guard';
import { User, UserDocument } from '../schema';
import { Model } from 'mongoose';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  register(@Request() req: ApiReq, @Body() createAuthDto: CreateUserDto) {
    return (this.userModel as any).signUp(req, createAuthDto);
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
