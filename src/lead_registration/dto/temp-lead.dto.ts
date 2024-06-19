import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TempLeadnDto {
  @ApiProperty({ example: 'frontend_1 || backend_2 ||...' })
  @IsString()
  @IsNotEmpty()
  leadPosition: string;

  @ApiProperty({ example: 'example@mail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  // @IsNotEmpty()
  @IsOptional()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  createdAt: Date;
}
