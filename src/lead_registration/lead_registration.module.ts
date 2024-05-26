import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeadRegistrationService } from './lead_registration.service';
import { LeadRegistrationController } from './lead_registration.controller';
import { Registration, RegistrationSchema } from 'src/shared/schema/lead-registration.schema';
import { UsersModule } from '../users/users.module'; // Import the UsersModule
import { User, UserSchema } from 'src/shared/schema';
import { TempLeadRegistration, TempLeadRegistrationSchema } from 'src/shared/schema/temp-lead_registration.schema';


@Module({
  providers: [LeadRegistrationService],
  controllers: [LeadRegistrationController],
  imports: [MongooseModule.forFeature([
    {name: Registration.name, schema: RegistrationSchema},
    {name: User.name, schema: UserSchema},
    {name: TempLeadRegistration.name, schema: TempLeadRegistrationSchema}
  ]),
UsersModule],
})
export class LeadRegistrationModule {}
