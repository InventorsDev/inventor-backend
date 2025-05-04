import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

class CountryDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  location: string;
}
class BasicInfoDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  profileSummary?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  phoneNumber?: number;

  @ApiProperty({ type: () => CountryDto })
  @IsOptional()
  country?: CountryDto;

  @ApiProperty()
  @IsOptional()
  @IsString()
  city?: string;
}

class ProfessionalInfoDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  company?: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  yearsOfExperience?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  school?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  primarySkill?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  secondarySkill?: string;

  @ApiProperty()
  @IsOptional()
  technologies?: string[];

  @ApiProperty()
  @IsOptional()
  interestAreas?: string[];
}
class ContactInfoDto {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  phone?: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  linkedInUrl?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  facebookUrl?: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  other?: any[];
}
export class UpdateUserDto {
  @IsOptional()
  @ApiProperty()
  email?: string;

  @ApiProperty()
  @IsOptional()
  password?: string;

  @ApiProperty({ type: () => BasicInfoDto })
  @IsOptional()
  basic_info?: BasicInfoDto;

  @ApiProperty({ type: () => ProfessionalInfoDto })
  @IsOptional()
  professional_info?: ProfessionalInfoDto;

  @ApiProperty({ type: () => ContactInfoDto })
  @IsOptional()
  contact_info?: ContactInfoDto;
}
