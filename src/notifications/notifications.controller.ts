import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import { JwtUsersGuard } from 'src/shared/auth/guards/jwt.users.guard';
import { ApiReq } from 'src/shared/interfaces';
import { NotificationsService } from './notifications.service';

@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'get all notifications',
    description:
      'returns all notifications based on the user type making the request',
  })
  @ApiResponse({
    status: 200,
    description: 'List of notifications',
  })
  @UseGuards(JwtUsersGuard)
  @Get()
  async getNotifications(@Request() req: ApiReq): Promise<string[]> {
    const notifications = await this.notificationsService.getNotifications(
      req.user._id.toString(),
    );
    return notifications;
  }

  @UseGuards(JwtUsersGuard)
  @Get(':notificationId')
  @ApiResponse({
    status: 200,
    description: 'Return the id of the object that prompted the notification',
  })
  async getNotificationParentId(
    @Param('notificationId') notificationId: string,
  ) {
    const notification =
      await this.notificationsService.getNotificationById(notificationId);
    return notification;
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Mark notification as read for users (DOES NOT WORK FOR ADMIN NOTIFICATIONS)',
    description:
      'Marks a specific notification as read for the requesting user',
  })
  @ApiParam({ name: 'notificationId', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
  })
  @UseGuards(JwtUsersGuard)
  @Patch(':notificationId/read')
  async markNotificationAsRead(
    @Param('notificationId') notificationId: string,
    @Request() req: ApiReq,
  ): Promise<boolean> {
    return await this.notificationsService.userReadNotification(
      notificationId,
      req.user._id.toString(),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Clear all notifications for user',
    description: 'Deletes all notifications for the requesting user',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications cleared',
  })
  @UseGuards(JwtUsersGuard)
  @Delete('clear')
  async clearUserNotifications(@Request() req: ApiReq): Promise<boolean> {
    return await this.notificationsService.userClearNotifications(
      req.user._id.toString(),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get admin notifications dashboard',
    description: 'Returns all admin notifications with optional filtering',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'read'] })
  @ApiResponse({
    status: 200,
    description: 'List of admin notifications',
  })
  @UseGuards(JwtAdminsGuard)
  @Get('admin/dashboard')
  async getAdminNotifications(
    @Query('status') status?: string,
  ): Promise<any[]> {
    return await this.notificationsService.getAdminNotifications(status);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mark admin notification as read',
    description: 'Marks a specific notification as read for admins',
  })
  @ApiParam({ name: 'notificationId', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
  })
  @UseGuards(JwtAdminsGuard)
  @Patch('admin/:notificationId/read')
  async markAdminNotificationAsRead(
    @Param('notificationId') notificationId: string,
  ): Promise<boolean> {
    return await this.notificationsService.adminReadNotification(
      notificationId,
    );
  }
}
