import { Module } from '@nestjs/common';
import { LeadRegistrationService } from './lead_registration.service';

@Module({
  providers: [LeadRegistrationService]
})
export class LeadRegistrationModule {}
