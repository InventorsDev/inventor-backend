import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { validateNumber } from 'src/shared/utils';

export class UserInviteDto {
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

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsDefined()
  password: string;

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

  @ApiProperty()
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  technologies?: string[];

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  linkedinUrl: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  githubUrl: string;
}
