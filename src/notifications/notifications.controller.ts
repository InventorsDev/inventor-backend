import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtUsersGuard } from 'src/shared/auth/guards/jwt.users.guard';
import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import { ApiReq } from 'src/shared/interfaces';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dtos/create-notification.dto';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtUsersGuard)
  @ApiTags('users')
  @Get('notifications')
  async getUserNotifications(@Request() req: ApiReq) {
    const userId = req.user._id.toString();
    const userRoles = req.user.role || [];
    return this.notificationsService.getUserNotifications(userId, userRoles);
  }

  @ApiBearerAuth()
  @UseGuards(JwtUsersGuard)
  @ApiTags('users')
  @Patch('notifications/:id/read')
  async markAsRead(@Request() req: ApiReq, @Param('id') id: string) {
    const userId = req.user._id.toString();
    return this.notificationsService.markAsRead(userId, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @ApiTags('admins')
  @Post('admins/notifications')
  async createNotification(@Body() payload: CreateNotificationDto) {
    return this.notificationsService.createNotification(payload);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @ApiTags('admins')
  @ApiQuery({ name: 'limit', required: false, type: String } as any)
  @ApiQuery({ name: 'page', required: false, type: String } as any)
  @Get('admins/notifications')
  async getAdminNotifications(@Request() req: ApiReq) {
    return this.notificationsService.getAdminNotifications(req);
  }
}
