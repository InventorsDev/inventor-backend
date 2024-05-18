import { Module } from '@nestjs/common';
import { LeadRegistrationService } from './lead_registration.service';
import { LeadRegistrationController } from './lead_registration.controller';

@Module({
  providers: [LeadRegistrationService],
  controllers: [LeadRegistrationController]
})
export class LeadRegistrationModule {}
