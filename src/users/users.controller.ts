import {
  Body,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Redirect,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Model } from 'mongoose';
import { JwtUsersGuard } from 'src/shared/auth/guards/jwt.users.guard';
import { CreateUserDto } from 'src/shared/dtos/create-user.dto';
import { ApiReq, userRoles, userStatuses } from 'src/shared/interfaces';
import { User, UserDocument } from 'src/shared/schema';
import { DeactivateAccountDto } from './dto/deactivate-account.dto';
import { RequestReactivationDto } from './dto/request-reactivation.dto';
import { TempLeadDto } from './dto/temp-lead.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserAddPhotoDto } from './dto/user-add-photo.dto';
import { UserChangePasswordDto } from './dto/user-change-password.dto';
import { UserInviteDto } from './dto/user-invite.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth()
  @UseGuards(JwtUsersGuard)
  @Get('me')
  async myProfile(@Request() req: ApiReq) {
    return this.usersService.findMe(req);
  }

  @ApiBearerAuth()
  @UseGuards(JwtUsersGuard)
  @Put('/change-password')
  async changePassword(
    @Request() req: ApiReq,
    @Body() payload: UserChangePasswordDto,
  ) {
    return this.usersService.changePassword(
      req,
      req.user._id.toString(),
      payload,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtUsersGuard)
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtUsersGuard)
  @Get('lookup/:email')
  async findByUsername(@Param('email') email: string) {
    const user = await this.usersService.findByEmail(email);
    return !!(user && user.email);
  }

  @ApiBearerAuth()
  @UseGuards(JwtUsersGuard)
  @Patch()
  update(@Request() req: ApiReq, @Body() payload: UpdateUserDto) {
    const userId = req.user._id.toString();
    return this.usersService.update(userId, payload);
  }

  @ApiBearerAuth()
  @UseGuards(JwtUsersGuard)
  @Put('/profile-photo')
  async addPhoto(@Request() req: ApiReq, @Body() payload: UserAddPhotoDto) {
    return this.usersService.addPhoto(req.user._id.toString(), payload);
  }

  // exising user requesting to be a lead
  @ApiBearerAuth()
  @UseGuards(JwtUsersGuard)
  @Post('/lead-registration')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBody({ type: TempLeadDto })
  async createLead(@Body() tempLeadDto: TempLeadDto): Promise<string> {
    const tempRegistration = await this.usersService.createTempRegistration(
      tempLeadDto.email,
      tempLeadDto.leadPosition,
    );
    return tempRegistration;
  }

  @Post('invite/complete-invite/')
  async completeProfile(
    @Body() body: UserInviteDto,
    @Query('token') token: string,
  ) {
    return this.usersService.completeProfile(body, token);
  }

  @ApiBearerAuth()
  @UseGuards(JwtUsersGuard)
  @Patch(':userId/request-verification')
  async RequestVerificationToken(
    @Request() req: ApiReq,
    @Param('userId') userId: string,
  ) {
    return this.usersService.requestVerification(req, userId);
  }

  @UseGuards(JwtUsersGuard)
  @Put(':userId/deactivate')
  async deactivateAccount(
    @Request() req: any,
    @Param('userId') userId: string,
    @Body() payload: DeactivateAccountDto,
  ) {
    // Optional: Use payload.reason if needed
    return this.usersService.deactivateAccount(userId);
  }

  @Put(':userId/request-reactivation')
  async requestReactivation(
    @Param('userId') userId: string,
    @Body() payload: RequestReactivationDto,
  ) {
    // Optional: Use payload.message if needed
    return this.usersService.requestReactivation(userId);
  }
}
