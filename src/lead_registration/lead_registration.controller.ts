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
@Controller('lead-registration')
export class LeadRegistrationController {
  constructor(private readonly registrationService: LeadRegistrationService) {}

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
  ): Promise<{ tempRegistrationId: string }> {
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
  ): Promise<{ message: string }> {
    const defaultMessage = 'Your application was rejected';
    const rejectionMessage = message || defaultMessage;
    await this.registrationService.rejectTempApplication(
      tempRegistrationId,
      rejectionMessage,
    );
    return { message: rejectionMessage };
  }
}
