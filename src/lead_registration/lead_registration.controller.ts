import { UseGuards, Redirect, Query, Controller, Post, Param, Body, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiBody, ApiQuery, ApiParam, ApiTags } from '@nestjs/swagger';
// import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import { LeadRegistrationService } from './lead_registration.service';
import { CreateLeadRegistrationDto } from './dto/create-lead_registration.dto';
import { Registration } from './schemas/lead_registration.schema';
import { promises } from 'dns';
import { UpdateLeadRegistrationDto } from './dto/update-lead_registration.dto';
import { PreFilledRegistrationDto } from './dto/pre-filled-lead_registration.dto';
import { GenerateLinkDto } from './dto/generate-link.dto';

@ApiTags('users')
@Controller('lead-registration')
export class LeadRegistrationController {
  constructor( private readonly registrationService: LeadRegistrationService){}

  @ApiBearerAuth()
  @ApiOperation({summary: 'get all applications'})
  @Get()
  async viewApplications(): Promise<Registration[]>{
    return await this.registrationService.viewApplications();
  }

  @ApiBearerAuth()
  @ApiOperation({summary: 'create a new request in the database for a new lead'})
  @ApiParam({ name: 'userId', description: 'The ID of the user' })
  @ApiBody({
    description: 'Registration Data',
    type: CreateLeadRegistrationDto,
  })
  @Post(':userId')
  async create(

    @Param('userId') userId: string,
    @Body() createRegistrationDto: CreateLeadRegistrationDto,
  ): Promise<Registration>{
    return await this.registrationService.create(userId, createRegistrationDto);
  }

  @ApiBearerAuth()
  @ApiOperation({summary: 'approve an application'})
  @ApiParam({ name: 'userId', description: 'The ID of the user' })
  @Put(':userId')
  async approveApplication(@Param('userId') userId: string,
  @Body() updateLeadRegistrationDto: UpdateLeadRegistrationDto): Promise<Registration> {
    const updateinfo = {
      ...updateLeadRegistrationDto,
      status: 'approved', // approve the status
    };
    return await this.registrationService.approveApplication(userId, updateinfo)
  }

  @ApiBearerAuth()
  @ApiOperation({summary: 'generate links'})
  @Post()
  generateLink(
    @Body() generateLinkDto: GenerateLinkDto): {link: string}{
    const { userId, role, status, ...preFilledParams } = generateLinkDto;
    const link = this.registrationService.generateUniqueLink(userId, role, status, preFilledParams);
    return { link };
  }

  // @ApiBearerAuth()
  @Get('create')
  @Redirect()
  redirectToCreate(@Query() queryParams: PreFilledRegistrationDto & { id: string }): { url: string } {
    console.log('create started')
    const link = `/lead-registration?${new URLSearchParams(queryParams as any).toString()}`;
    return { url: link };
  }
}