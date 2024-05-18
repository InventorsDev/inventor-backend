import {IsString, IsNotEmpty } from 'class-validator';

export class CreateLeadRegistrationDto{
  @IsString()
  @IsNotEmpty()
  applicationId: string;
}