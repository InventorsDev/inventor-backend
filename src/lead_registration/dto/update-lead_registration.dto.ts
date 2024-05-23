import { PartialType } from '@nestjs/mapped-types';
import { CreateLeadRegistrationDto } from './create-lead_registration.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';
import { validateNumber } from 'src/shared/utils';


export class UpdateLeadRegistrationDto extends PartialType(CreateLeadRegistrationDto) {
  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  firstName?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  lastName?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  userHandle?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  photo?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsOptional()
  age?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  @ValidateIf((data) => validateNumber(data.phone))
  phone?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  userId: string;
}