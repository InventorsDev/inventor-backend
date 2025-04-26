import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Model } from 'mongoose';
import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import { CreateUserDto } from 'src/shared/dtos/create-user.dto';
import { ApiReq, userRoles, userStatuses } from 'src/shared/interfaces';
import { User, UserDocument } from 'src/shared/schema';
import { createLeadDto } from './dto/lead-invite-dto';
import { RejectApplicationDto } from './dto/reject-lead-application.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserAddPhotoDto } from './dto/user-add-photo.dto';
import { UserChangePasswordDto } from './dto/user-change-password.dto';
import { UserInviteDto } from './dto/user-invite.dto';
import { UsersService } from './users.service';

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
  @ApiOperation({
    summary: 'get my info',
    description: 'returns all the information about the user in json',
  })
  getUserProfile(@Request() req: ApiReq) {
    return this.usersService.findMe(req);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @ApiOperation({
    summary: 'check exisiting email',
    description:
      'check if the email is a valid user email that exists on our database',
  })
  @Get('users/lookup/:email')
  async findByUsername(@Param('email') email: string) {
    const user = await this.usersService.findByEmail(email);
    return !!(user && user.email);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Delete('users/:id')
  @ApiOperation({
    summary: 'delete a user',
    description:
      'Delete a user from the application and all their data. Note. As of now, data cannot be reocvered',
  })
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
  @Patch('users')
  update(@Request() req: ApiReq, @Body() payload: UpdateUserDto) {
    const userId = req.user._id.toString();
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
  @Patch('users/:userId/request-verification')
  async RequestVerificationToken(
    @Request() req: ApiReq,
    @Param('userId') userId: string,
  ) {
    return this.usersService.requestVerification(req, userId);
  }

  // TODO: since we're using JwT to pass and handle data on each request, why are we passing userId?
  // also we seem to be reqiring that they pass in the user json data?
  // @oyedeletemitope;
  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @ApiOperation({
    summary: 'update user status',
    description: 'changees the current status of the selected uerId',
  })
  @Patch('users/:userId/status')
  async updateUserStatus(
    @Request() req: any,
    @Param('userId') userId: string,
    @Body() payload: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(userId, payload.status);
  }
  // find an application by email
  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @ApiQuery({ name: 'email', description: 'user email' })
  @ApiOperation({
    summary: 'get a lead applicaiton',
    description: 'finds a lead application using email.',
  })
  @Get('lead/application/:email')
  async getApplicationByEmail(
    @Query('email') email: string,
  ): Promise<UserDocument> {
    return this.usersService.viewOneApplication(email);
  }

  // list all lead applications
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'list all pending lead applications',
    description: 'Get reqest searches for all active/pending lead applications',
  })
  @UseGuards(JwtAdminsGuard)
  @Get('lead/applications')
  async viewApplications(): Promise<UserDocument[]> {
    return await this.usersService.viewApplications();
  }

  // approve lead application
  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @ApiParam({
    name: 'email',
    description: 'Email of the user application',
  })
  @ApiOperation({
    summary: 'approve a lead application',
    description:
      'finds a pending lead application using the email query param and apporve that pending applicaton on that account',
  })
  @Patch('lead/:email/approve')
  async approveApplication(@Param('email') email: string): Promise<string> {
    return await this.usersService.approveTempApplication(email);
  }

  // reject a lead request
  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @ApiBody({ type: RejectApplicationDto })
  @Patch('lead/:email/reject')
  async reject(
    @Param('email') email: string,
    @Body() rejectApplicationDto: RejectApplicationDto,
  ): Promise<string> {
    const defaultMessage = 'Your application was rejected';
    const rejectionMessage = rejectApplicationDto.message || defaultMessage;
    return await this.usersService.rejectTempApplication(
      email,
      rejectionMessage,
    );
  }

  // // generate registration link
  // @ApiBearerAuth()
  // @UseGuards(JwtAdminsGuard)
  // @ApiOperation({
  //   summary: 'send invite to user',
  //   description: 'send an invitation email to new leads to register',
  // })
  // @Get('inviteLead/:email') // receive the email param
  // async generateLink(@Param('email') email: string): Promise<{ link: string }> {
  //   // generate and return the link
  //   const link = await this.usersService.inviteLead(email);
  //   return { link };
  // }

  // invite a lead
  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @ApiOperation({
    summary: 'send a lead invite to an email',
    description:
      'create a temp account with default/no password and send an invitation link to the email provided in the request',
  })
  @Post('lead/invite')
  async inviteLead(@Body() body: createLeadDto) {
    return await this.usersService.inviteLead(body.email);
  }

  // validate the invite lead token
  @Get('lead/invite/accept')
  async validateToken(@Query('token') token: string) {
    return await this.usersService.validateToken(token);
  }

  // view all leads
  @Get()
  async getUsersWithLeadRole(): Promise<User[]> {
    return this.usersService.getUsersWithLeadRole();
  }
}
