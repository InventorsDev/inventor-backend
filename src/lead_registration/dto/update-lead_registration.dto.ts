import { PartialType } from '@nestjs/mapped-types';
import { CreateLeadRegistrationDto } from './create-lead_registration.dto';
export class UpdateLeadRegistrationDto extends PartialType(CreateLeadRegistrationDto) {}