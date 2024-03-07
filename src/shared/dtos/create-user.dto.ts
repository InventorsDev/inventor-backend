import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LocationDto } from './location.dto';

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
