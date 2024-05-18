import { Controller, Post, Param, Body } from '@nestjs/common';
import { LeadRegistrationService } from './lead_registration.service';
import { CreateLeadRegistrationDto } from './dto/create-lead_registration.dto';

@Controller('users/:userId/lead-registration')
export class LeadRegistrationController {
  constructor( private readonly registrationService: LeadRegistrationService){}

  @Post()
  create(
    @Param('userId') userId: string,
    @Body() createRegistrationDto: CreateLeadRegistrationDto,
  ){
    return this.registrationService.create(userId, createRegistrationDto);
  }
}