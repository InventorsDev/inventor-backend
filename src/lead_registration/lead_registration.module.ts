import { Module } from '@nestjs/common';
import { LeadRegistrationService } from './lead_registration.service';
import { LeadRegistrationController } from './lead_registration.controller';
import { UsersModule } from 'src/users/users.module';
import { DBModule } from 'src/shared/schema';


@Module({
  imports: [DBModule, UsersModule],
  providers: [LeadRegistrationService],
  controllers: [LeadRegistrationController],
  exports: [LeadRegistrationService],
})
export class LeadRegistrationModule {}
