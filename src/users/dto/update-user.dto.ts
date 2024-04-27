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
import { UserRole, userRoles } from 'src/shared/interfaces';
import { validateNumber } from 'src/shared/utils';

export class UpdateUserDto {
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

  @ApiProperty({ enumName: 'RoleInviteType', enum: UserRole })
  @IsOptional()
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
  roles?: UserRole[];

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
  deviceId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  deviceToken?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  userId: string;
}
