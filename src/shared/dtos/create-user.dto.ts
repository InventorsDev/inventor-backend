import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { LocationDto } from './location.dto';
import { RegistrationMethod, registrationMethods } from '../interfaces';
import { BadRequestException } from '@nestjs/common';

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ enumName: 'UserRegistrationType', enum: registrationMethods })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @ValidateIf((data) => {
    if (!registrationMethods.includes(data.joinMethod)) {
      throw new BadRequestException('Please supply a valid sign up options');
    }
    return true;
  })
  joinMethod: RegistrationMethod;

  @ApiProperty({ type: LocationDto })
  @IsNotEmpty()
  @IsOptional()
  location?: LocationDto;

  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  deviceToken?: string;
}
