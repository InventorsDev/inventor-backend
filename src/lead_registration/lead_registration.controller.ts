import { UseGuards, Redirect, Query, Controller, Post, Param, Body, Get, Put, NotFoundException, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiBody, ApiQuery, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import { LeadRegistrationService } from './lead_registration.service';
import { CreateLeadRegistrationDto } from './dto/create-lead_registration.dto';
import { Registration } from 'src/shared/schema/lead_registration.schema';
import { NewUserLeadRegistrationDto } from './dto/new-user-lear-registration.dto';
import { RejectLeadRegistrationDto } from './dto/reject-lead-regstration.dto';

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
  @Post('create')
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
      const {userId, email} = this.registrationService.paraseEncryptedParams(encryptedData);
      //check the user Id
      if (userId){
        const userExists = await this.registrationService.userExists(userId)
        // if the id does not exist
        if (!userExists){throw new NotFoundException('User Not found')}

        //if the user exists
        const link = `/lead-registration/create?${new URLSearchParams({userId,email}).toString()}`
        return {url: link}
      }
      else{ 
        // if user dones not exist
        const newReglink = `/lead-registration/new-user-form?${new URLSearchParams(email).toString()}`;
        return { url: newReglink };
      } 
    } catch (error){throw new NotFoundException('Invalid link')};
  }

  // new route for existing users from generated link
  @Get('pre-filed-form')
  @ApiOperation({summary: 'lead registration form with pre filled information'})
  async preFilledForm(@Query('email') email:string, @Query('userId') userId: string): Promise<{email:string, userId: string}>{
    const user = await this.registrationService.findUserById(userId);
    if (!user){throw new NotFoundException('User not found')} //just in case
    return {email: user.email, userId: userId}
  }

  // route for new users from generated link
    @Get('new-user-form')
    @ApiOperation({summary: 'new user and lead registration form'})
    async newUserForm(@Query('email') email: string,): Promise<{email: string}>{
      return{email}
    }

  // register new user
  @ApiTags('users')
  @Post('register-new-user')
  @ApiOperation({summary: 'register a new user and a lead'})
  @ApiBody({
    description: 'new user and lead registration data',
    type: NewUserLeadRegistrationDto,
  })
  async registerNewUser(@Body() newUserLeadDto: NewUserLeadRegistrationDto): Promise<{tempRegistrationId: string}>{
    const registration = await this.registrationService.createNewUserAndLead(newUserLeadDto)
    return {tempRegistrationId: registration._id}
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

  // reject a lead request
  @ApiBearerAuth()
  @ApiTags('admins')
  @UseGuards(JwtAdminsGuard)
  @ApiOperation({summary: 'reject(delete) an application'})
  @ApiParam({name: 'tempRegistrationId', description: 'the temp registration id to be deleted'})
  @Delete('reject/:tempRegistrationId')
  async reject(
    @Param('tempRegistrationId') tempRegistrationId: string,
    @Body()rejectLeadRegistrationDto: RejectLeadRegistrationDto): Promise<{message: string}>{
    const message = await this.registrationService.rejectTempApplication(tempRegistrationId, rejectLeadRegistrationDto.message)
    return {message}
  }
}