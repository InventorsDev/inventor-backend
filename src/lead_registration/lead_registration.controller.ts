import { UseGuards, Redirect, Query, Controller, Post, Param, Body, Get, Put, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiBody, ApiQuery, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import { LeadRegistrationService } from './lead_registration.service';
import { CreateLeadRegistrationDto } from './dto/create-lead_registration.dto';
import { Registration } from 'src/shared/schema/lead_registration.schema';

@Controller('lead-registration')
export class LeadRegistrationController {
  constructor( private readonly registrationService: LeadRegistrationService){}

  // lis tall applications
  @ApiBearerAuth()
  @ApiTags('admins')
  @UseGuards(JwtAdminsGuard)
  @ApiOperation({summary: 'view al submitted applications'})
  @Get()
  async viewApplications(): Promise<Registration[]>{
    return await this.registrationService.viewApplications();
  }

  // user regestring to be a lead
  @ApiTags('users')
  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @ApiOperation({summary: 'create a new lead application and store it'})
  @ApiParam({ name: 'userId', description: 'The ID of the user' })
  @ApiBody({ description: 'Registration Data', type: CreateLeadRegistrationDto,})
  @Post('/lead-registration/:userId')
  async create(
    @Body() createRegistrationDto: CreateLeadRegistrationDto,
  ): Promise<{ tempRegistrationId: string}>{
    const tempRegistration = await this.registrationService.createTempRegistration(createRegistrationDto)
    return {tempRegistrationId: tempRegistration._id};
  }

  // verify application by regisration_id
  @ApiBearerAuth()
  @ApiTags('admins')
  @UseGuards(JwtAdminsGuard)
  @ApiOperation({summary: 'approve a temporary applicaion'})
  @ApiParam({ name: 'tempRegistrationId', description: 'Id of the tempRegistration' })
  @Put('approve/:tempRegistrationId') // have the tempReg in the parms
  async approveApplication(@Param('tempRegistrationId') tempRegistrationId: string): Promise<Registration> {
    return await this.registrationService.approveTempApplication(tempRegistrationId)
  }

  // generate registration link
  @ApiBearerAuth()
  @ApiTags('admins')
  @UseGuards(JwtAdminsGuard)
  @ApiOperation({summary: 'generate application links'})
  @ApiParam({name: 'userEmail', description: 'the email of the user'})
  @Get('generate-link/:email') // receive the email param
  async generateLink(@Param('email') email: string,): Promise<{link: string}>{
    // generate and return the link
    const link = await this.registrationService.generateUniqueLink(email);
    return { link };
  }

  // link create application
  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Get('register')
  @ApiOperation({summary: 'register a lead using a generated link'})
  @Redirect()
  async register(@Query('data') encryptedData: string): Promise<{ url: string }> {
    try{
      const params = this.registrationService.paraseEncryptedParams(encryptedData);
      const link = `/lead-registration/create?${new URLSearchParams(params).toString()}`;
      return { url: link };
    } catch (error){throw new NotFoundException('Invalid link')};
  }

  // find an application by email
  @ApiBearerAuth()
  @ApiTags('admins')
  @UseGuards(JwtAdminsGuard)
  @ApiOperation({summary: 'view an application by email'})
  @ApiQuery({name: 'email', description: 'user email'})
  @Get('application')
  async getApplicationByEmail (@Query('email')email: string): Promise<Registration>{
    return await this.registrationService.ViewOneApplicaiton(email)
  }
}