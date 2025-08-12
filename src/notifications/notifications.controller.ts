import { Controller, Get, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ApiReq } from 'src/shared/interfaces';
import { NotificationsService } from './notifications.service';

@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'List of notifications',
  })
  async getNotifications(@Request() req: ApiReq): Promise<string[]> {
    // fetch notifications for user
    const notifications = await this.notificationsService.getNotifications(
      req.user._id.toString(),
    );
    return notifications;
  }
}
