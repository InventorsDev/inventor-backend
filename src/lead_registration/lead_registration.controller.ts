import { UseGuards,Controller, Post, Param, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiBody, ApiQuery, ApiParam, ApiTags } from '@nestjs/swagger';
// import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import { LeadRegistrationService } from './lead_registration.service';
import { CreateLeadRegistrationDto } from './dto/create-lead_registration.dto';

@ApiTags('users')
@Controller('users/:userId/lead-registration')
export class LeadRegistrationController {
  constructor( private readonly registrationService: LeadRegistrationService){}

  @ApiBearerAuth()
  @ApiOperation({summary: 'create a new request in the database for a new lead'})
  @ApiParam({ name: 'userId', description: 'The ID of the user' })
  @ApiBody({
    description: 'Registration Data',
    type: CreateLeadRegistrationDto,
  })
  @Post()
  create(

    @Param('userId') userId: string,
    @Body() createRegistrationDto: CreateLeadRegistrationDto,
  ){
    return this.registrationService.create(userId, createRegistrationDto);
  }
}