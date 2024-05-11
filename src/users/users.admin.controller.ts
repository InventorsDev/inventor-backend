import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Delete,
  Put,
  Patch,
  Inject,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User, UserDocument } from 'src/shared/schema';
import { Model } from 'mongoose';
import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import { UserInviteDto } from './dto/user-invite.dto';
import {
  ApiReq,
  UserStatus,
  userRoles,
  userStatuses,
} from 'src/shared/interfaces';
import { CreateUserDto } from 'src/shared/dtos/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserAddPhotoDto } from './dto/user-add-photo.dto';
import { UserChangePasswordDto } from './dto/user-change-password.dto';

@ApiTags('admins')
@Controller('admins')
export class UsersAdminsController {
  constructor(
    @Inject(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly usersService: UsersService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Post('/')
  async userInvite(@Body() payload: UserInviteDto) {
    return this.usersService.userInvite(payload);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Get('me')
  getUserProfile(@Request() req: ApiReq) {
    return this.usersService.findMe(req);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Get('users/lookup/:email')
  async findByUsername(@Param('email') email: string) {
    const user = await this.usersService.findByEmail(email);
    return !!(user && user.email);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Delete('users/:id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @ApiQuery({ name: 'limit', required: false, type: String } as any)
  @ApiQuery({ name: 'page', required: false, type: String } as any)
  @ApiQuery({
    name: 'order',
    required: false,
    type: String,
    enum: ['ASC', 'DESC'],
  } as any)
  @ApiQuery({
    name: 'userByStatuses',
    required: false,
    type: String,
    description: `One ore more of "${userStatuses}" separated by comma`,
  } as any)
  @ApiQuery({
    name: 'userByRoles',
    required: false,
    type: String,
    description: `One ore more of "${userRoles}" separated by comma`,
  } as any)
  @ApiQuery({
    name: 'userByIds',
    required: false,
    type: String,
    description: 'Separated by commas',
  } as any)
  @ApiQuery({
    name: 'userDateRange',
    required: false,
    type: String,
    description: 'e.g: 2020-11-12,2022-11-15',
  } as any)
  @Get()
  findAll(@Request() req: ApiReq) {
    return this.usersService.findAll(req);
  }

  @UseGuards(JwtAdminsGuard)
  @Post('users')
  async createUser(@Request() req: ApiReq, @Body() payload: CreateUserDto) {
    return (this.userModel as any).signUp(req, payload);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Patch('users/:userId')
  update(
    @Request() req: ApiReq,
    @Param('userId') userId: string,
    @Body() payload: UpdateUserDto,
  ) {
    return this.usersService.update(userId, payload);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Put('users/:userId/profile-photo')
  async addPhoto(
    @Request() req: ApiReq,
    @Param('userId') userId: string,
    @Body() payload: UserAddPhotoDto,
  ) {
    return this.usersService.addPhoto(payload.userId, payload);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Put('users/:userId/change-password')
  async changePassword(
    @Request() req: ApiReq,
    @Param('userId') userId: string,
    @Body() payload: UserChangePasswordDto,
  ) {
    return this.usersService.changePassword(req, userId, payload, true);
  }

  @Post('users/:email/forget-password')
  async forgetPassword(@Param('email') email: string) {
    return (this.userModel as any).forgetPassword(email);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Put('users/:userId/verify/:token/email')
  async verifyEmail(
    @Param('userId') userId: string,
    @Param('token') token: string,
  ) {
    return (this.userModel as any).verifyEmail(userId, token);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Post('users/:userId/email-verification')
  async sendEmailVerificationToken(
    @Request() req: ApiReq,
    @Param('userId') userId: string,
  ) {
    return this.usersService.sendEmailVerificationToken(req, userId);
  }
}
