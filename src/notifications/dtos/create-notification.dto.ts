import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { UserRole } from 'src/shared/interfaces/user.type';

export class CreateNotificationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiProperty({ enum: ['USER', 'ROLE', 'ALL'] })
  @IsNotEmpty()
  @IsEnum(['USER', 'ROLE', 'ALL'])
  targetType: 'USER' | 'ROLE' | 'ALL';

  @ApiProperty({ type: [String], required: false })
  @ValidateIf((o) => o.targetType === 'ROLE')
  @IsNotEmpty()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  targetRoles?: UserRole[];

  @ApiProperty({ type: [String], required: false })
  @ValidateIf((o) => o.targetType === 'USER')
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  targetUsers?: string[];
}
