import { IsDefined, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserChangePasswordDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  oldPassword?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDefined()
  @IsString()
  newPassword: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDefined()
  @IsString()
  confirmPassword: string;
}
