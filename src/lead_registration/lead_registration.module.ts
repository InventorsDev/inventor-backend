import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeadRegistrationService } from './lead_registration.service';
import { LeadRegistrationController } from './lead_registration.controller';
import { Registration, RegistrationSchema } from './schemas/lead_registration.schema';
import { UsersModule } from '../users/users.module'; // Import the UsersModule


@Module({
  providers: [LeadRegistrationService],
  controllers: [LeadRegistrationController],
  imports: [MongooseModule.forFeature([{ name: Registration.name, schema: RegistrationSchema }]),
UsersModule],
})
export class LeadRegistrationModule {}
