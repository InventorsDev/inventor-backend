import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Put,
  UsePipes,
  ValidationPipe,
  Redirect,
  Query,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtUsersGuard } from 'src/shared/auth/guards/jwt.users.guard';
import { ApiReq, userRoles, userStatuses } from 'src/shared/interfaces';
import { CreateUserDto } from 'src/shared/dtos/create-user.dto';
import { UserChangePasswordDto } from './dto/user-change-password.dto';
import { UserAddPhotoDto } from './dto/user-add-photo.dto';
import { TempLeadDto } from './dto/temp-lead.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Request() req: ApiReq, @Body() createUserDto: CreateUserDto) {
    // return this.usersService.create(req, createUserDto);
  }

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
  @Patch(':userId')
  update(
    @Request() req: ApiReq,
    @Param('userId') userId: string,
    @Body() payload: UpdateUserDto,
  ) {
    return this.usersService.update(req.user._id.toString(), payload);
  }

  @ApiBearerAuth()
  @UseGuards(JwtUsersGuard)
  @Put('/profile-photo')
  async addPhoto(@Request() req: ApiReq, @Body() payload: UserAddPhotoDto) {
    return this.usersService.addPhoto(req.user._id.toString(), payload);
  }

  // user regestring to be a lead
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

  // handle generated links
  @Get('invite-link')
  @ApiOperation({ summary: 'Handle generated link routing' })
  @Redirect()
  async register(
    @Query('data') encryptedData: string,
  ): Promise<{ url: string }> {
    try {
      const { userId, email } =
        this.usersService.paraseEncryptedParams(encryptedData);
      if (!userId)
        return {
          url: `/leads/new-user-form?${new URLSearchParams({ email }).toString()}`,
        };

      const userExists = await this.usersService.findById(userId);
      if (!userExists) throw new NotFoundException('User Not found');

      return {
        url: `/leads/createLead?email=${userExists.email}`,
      };
    } catch (error) {
      throw new NotFoundException('Invalid link');
    }
  }

  // handle unregistered user lead appplication
  @Post('new-user-form')
  @ApiOperation({ summary: 'Create a new user and makes them a lead' })
  async newUserForm(@Body() userData: CreateUserDto): Promise<{ url: string }> {
    try {
      const user = await this.usersService.createUser(userData);
      return {
        url: `/leads/create?email=${user.email}`,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to create user');
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
}
