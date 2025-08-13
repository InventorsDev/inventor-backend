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
  @ApiProperty({
    description:
      'the userid of the person receiving the notification/ person that made the request',
  })
  @IsNotEmpty()
  receiverId: string;

  @ApiProperty({
    description: 'determinies if the notification is a lead or event',
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  @ValidateIf((data) => {
    if (!notificationTypes.includes(data.type)) {
      throw new BadRequestException('Please supply a valid notification type');
    }
    return true;
  })
  notification_type: ['lead', 'event'];

  @ApiProperty({
    description:
      'the id of the object that prompted the notification, eg the application id',
  })
  @IsNotEmpty()
  @IsString()
  entityId: string;

  @ApiProperty({
    description: 'message displayed as summary for the notification',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    description:
      'mark if the user has opened but not resolved the notification',
  })
  @IsBoolean()
  @IsNotEmpty()
  isRead: boolean;

  @ApiProperty({ description: 'is this a admin notification' })
  @IsBoolean()
  @IsNotEmpty()
  isAdminNotification: boolean;

  @ApiProperty({
    description: 'additional data to be sent with the notification',
  })
  @IsOptional()
  data: any;
}
