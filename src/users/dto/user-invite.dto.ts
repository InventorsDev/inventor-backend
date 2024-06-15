import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import {
  RegistrationMethod,
  UserRole,
  registrationMethods,
  userRoles,
} from 'src/shared/interfaces';
import { validateNumber } from 'src/shared/utils';

export class UserInviteDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsDefined()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsDefined()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsDefined()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ enumName: 'RoleInviteType', enum: UserRole })
  @IsDefined()
  @IsArray()
  @IsNotEmpty()
  @ValidateIf((data) => {
    const isValidRole = data.roles.every((role) => userRoles.includes(role));
    if (!isValidRole) {
      throw new BadRequestException('Please supply valid role types');
    }
    return true;
  })
  roles: UserRole[];

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

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsDefined()
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
  deviceId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  deviceToken?: string;
}
