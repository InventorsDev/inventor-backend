import {
  // UseGuards,
  Controller,
  Get,
  Post,
  Body,
  Param,
  // Query,
  UsePipes,
  ValidationPipe,
  Put,
  Query,
  Delete,
  Redirect,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  // ApiQuery,
  // ApiTags,
} from '@nestjs/swagger';
// import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import { LeadRegistrationService } from './lead_registration.service';
import { TempLeadRegistration } from 'src/shared/schema';
import { TempLeadnDto } from './dto/temp-lead.dto';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from 'src/shared/dtos/create-user.dto';
@Controller('lead-registration')
export class LeadRegistrationController {
  constructor(
    private readonly registrationService: LeadRegistrationService,
    private readonly usersService: UsersService,
  ) {}

  // list all applications
  @ApiBearerAuth()
  // @ApiTags('admins')
  // @UseGuards(JwtAdminsGuard)
  @ApiOperation({ summary: 'view all submitted applications' })
  @Get()
  async viewApplications(): Promise<TempLeadRegistration[]> {
    return await this.registrationService.viewApplications();
  }

  // find an application by email
  // @ApiBearerAuth()
  // @ApiTags('admins')
  // @UseGuards(JwtAdminsGuard)
  @ApiOperation({ summary: 'view an appliation by email' })
  @ApiQuery({ name: 'email', description: 'user email' })
  @Get('application')
  getApplicationByEmail(
    @Query('email') email: string,
  ): Promise<TempLeadRegistration> {
    return this.registrationService.viewOneApplication(email);
  }

  // user regestring to be a lead
  // @ApiTags('users')
  // @ApiBearerAuth()
  // @UseGuards(JwtAdminsGuard)
  @Post('create')
  @ApiOperation({ summary: 'Register to be a lead' })
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBody({ type: TempLeadnDto })
  async create(
    @Body() tempLeadDto: TempLeadnDto,
    @Query('email') email: string,
  ): Promise<{ tempRegistrationId: string }> {
    tempLeadDto.email = email;
    const tempRegistration =
      await this.registrationService.createTempRegistration(tempLeadDto);
    return { tempRegistrationId: tempRegistration._id };
  }

  // verify application by regisration_id
  @ApiBearerAuth()
  // @ApiTags('admins')
  // @UseGuards(JwtAdminsGuard)
  @ApiOperation({ summary: 'approve a temporary applicaion' })
  @ApiParam({
    name: 'tempRegistrationId',
    description: 'Id of the tempRegistration',
  })
  @Put('approve/:tempRegistrationId') // have the tempReg in the parms
  async approveApplication(
    @Param('tempRegistrationId') tempRegistrationId: string,
  ): Promise<string> {
    return await this.registrationService.approveTempApplication(
      tempRegistrationId,
    );
  }

  // reject a lead request
  // @ApiBearerAuth()
  // @ApiTags('admins')
  // @UseGuards(JwtAdminsGuard)
  @ApiOperation({ summary: 'reject(delete) an application' })
  @ApiParam({
    name: 'tempRegistrationId',
    description: 'the temp registration id to be deleted',
  })
  @Delete('reject/:tempRegistrationId')
  async reject(
    @Param('tempRegistrationId') tempRegistrationId: string,
    @Body('message') message: string,
  ): Promise<{ message: string; userId: string }> {
    const defaultMessage = 'Your application was rejected';
    const rejectionMessage = message || defaultMessage;
    const user =
      await this.registrationService.rejectTempApplication(tempRegistrationId);
    return { message: rejectionMessage, userId: user.email };
  }

  // generate registration link
  // @ApiBearerAuth()
  // @ApiTags('admins')
  // @UseGuards(JwtAdminsGuard)
  @ApiOperation({ summary: 'generate application links' })
  @Get('generate-link/:email') // receive the email param
  async generateLink(@Param('email') email: string): Promise<{ link: string }> {
    // generate and return the link
    const link = await this.registrationService.generateUniqueLink(email);
    return { link };
  }

  // handle generated links
  @Get('register')
  @ApiOperation({ summary: 'Handle generated link routing' })
  @Redirect()
  async register(
    @Query('data') encryptedData: string,
  ): Promise<{ url: string }> {
    try {
      const { userId, email } = this.registrationService.paraseEncryptedParams(
        new URL(encryptedData).searchParams.get('data'),
      );
      if (!userId)
        return {
          url: `/lead-registration/new-user-form?${new URLSearchParams({ email }).toString()}`,
        };

      const userExists = await this.usersService.findById(userId);
      if (!userExists) throw new NotFoundException('User Not found');

      return {
        url: `/lead-registration/create?email=${userExists.email}`,
      };
    } catch (error) {
      throw new NotFoundException('Invalid link');
    }
  }

  // handle new user form submission
  @Post('new-user-form')
  @ApiOperation({ summary: 'Create a new user and temp lead' })
  async newUserForm(@Body() userData: CreateUserDto): Promise<{ url: string }> {
    try {
      const user = await this.registrationService.createUser(userData);
      return {
        url: `/lead-registration/create?email=${user.email}`,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to create user');
    }
  }
}
