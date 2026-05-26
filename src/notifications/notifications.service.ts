import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from 'src/shared/schema/notification.schema';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { UserRole } from 'src/shared/interfaces/user.type';
import { ApiReq } from 'src/shared/interfaces';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async createNotification(dto: CreateNotificationDto): Promise<NotificationDocument> {
    const targetUsers = dto.targetUsers?.map((id) => new Types.ObjectId(id)) || [];
    const createdNotification = new this.notificationModel({
      message: dto.message,
      link: dto.link,
      targetType: dto.targetType,
      targetRoles: dto.targetRoles || [],
      targetUsers: targetUsers,
      readBy: [],
    });
    return createdNotification.save();
  }

  async getUserNotifications(userId: string, userRoles: UserRole[]) {
    const userObjectId = new Types.ObjectId(userId);

    const notifications = await this.notificationModel
      .find({
        $or: [
          { targetType: 'ALL' },
          { targetType: 'ROLE', targetRoles: { $in: userRoles } },
          { targetType: 'USER', targetUsers: userObjectId },
        ],
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return notifications.map((notif) => {
      const readByStrings = (notif.readBy || []).map((id) => id.toString());
      return {
        id: notif._id.toString(),
        message: notif.message,
        link: notif.link,
        targetType: notif.targetType,
        createdAt: notif.createdAt,
        isRead: readByStrings.includes(userId),
      };
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const updated = await this.notificationModel
      .findByIdAndUpdate(
        notificationId,
        { $addToSet: { readBy: userObjectId } },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Notification not found');
    }

    return { success: true };
  }

  async getAdminNotifications(req: ApiReq) {
    // Basic administrative listing of all notifications
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.notificationModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.notificationModel.countDocuments().exec(),
    ]);

    return {
      data: data.map((notif) => ({
        id: notif._id.toString(),
        message: notif.message,
        link: notif.link,
        targetType: notif.targetType,
        targetRoles: notif.targetRoles,
        targetUsers: notif.targetUsers,
        createdAt: notif.createdAt,
        readCount: notif.readBy?.length || 0,
      })),
      total,
      page,
      limit,
    };
  }
}
