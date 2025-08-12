import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { NotificationType } from '../interfaces';

const notificationTypes = Object.values(NotificationType);

export class NotificationDto {
  @ApiProperty({ description: '' })
  @IsNotEmpty()
  receiverId: string;

  @ApiProperty({ description: '' })
  @IsNotEmpty()
  @ValidateIf((data) => {
    if (!notificationTypes.includes(data.type)) {
      throw new BadRequestException('Please supply a valid notification type');
    }
    return true;
  })
  notification_type: ['lead', 'event'];

  @ApiProperty({ description: '' })
  @IsNotEmpty()
  @IsString()
  entityId: string;

  @ApiProperty({ description: '' })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({ description: '' })
  @IsBoolean()
  @IsNotEmpty()
  isRead: boolean;

  @ApiProperty({ description: 'is this a admin notification' })
  @IsBoolean()
  @IsNotEmpty()
  isAdminNotification: boolean;

  @ApiProperty({ description: '' })
  @IsOptional()
  data: any;
}
