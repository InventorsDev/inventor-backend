import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { NotificationDto } from 'src/shared/dtos/notificatoin.dto';
import { NotificationInfo, User } from 'src/shared/schema';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NotificationInfo.name)
    private readonly notificationModel: Model<NotificationInfo>,
    @Inject(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async getNotifications(userId: string): Promise<string[]> {
    // check if user exists
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Request is not from a valid user');
    //fetch notifications for user type
    let notifications = [];
    const user_type = user.role[0];
    if (user_type === 'ADMIN') {
      //return all admin notifications
      notifications = await this.notificationModel
        .find({ isAdminNotification: true })
        .lean()
        .exec(); // using lean for plain js object
      return notifications;
    }
    // return all user/lead notifications for the user
    notifications = await this.notificationModel
      .find({ receiverId: userId })
      .lean()
      .exec();
    return notifications;
  }

  async getNotificationById(
    notification_id: string,
  ): Promise<{ notificationId: string; parentId: string }> {
    const notification = await this.notificationModel.findById(notification_id);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return {
      notificationId: notification._id.toString(),
      parentId: notification.entityId,
    };
  }

  async getUnreadNotificationsByEntity(entityId: string): Promise<any[]> {
    const notifications = await this.notificationModel
      .find({ entityId })
      .lean()
      .exec();

    if (notifications.length === 0) {
      throw new NotFoundException(
        'No unread notifications found for this entity',
      );
    }

    return notifications;
  }

  async createNotification(notification: NotificationDto): Promise<string> {
    const newNotification = await this.notificationModel.create({
      receiverId: notification.receiverId,
      notification_type: notification.notification_type,
      entityId: notification.entityId,
      message: notification.message,
      data: notification.data,
      isRead: notification.isRead,
      isAdminNotification: notification.isAdminNotification,
    });
    if (newNotification._id === undefined) {
      throw new InternalServerErrorException('Error creating notification');
    }
    return newNotification._id.toString();
  }

  async deleteNotification(notification_id: string): Promise<boolean> {
    const notification = await this.notificationModel.deleteOne({
      _id: notification_id,
    });
    if (notification.deletedCount === 0) {
      throw new NotFoundException('Notification not found');
    }
    return true;
  }

  async markNotificationAsRead(
    notification_id: string,
    search_params: {},
  ): Promise<boolean> {
    // validate the object id
    if (!Types.ObjectId.isValid(notification_id)) {
      throw new NotFoundException('Invalid ObjectId');
    }
    const notification = await this.notificationModel
      .findOneAndUpdate(search_params, { isRead: true }, { new: true })
      .lean()
      .exec();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return true;
  }

  async adminReadNotification(notification_id: string): Promise<boolean> {
    const marked = await this.markNotificationAsRead(notification_id, {
      _id: notification_id,
    });
    return marked;
  }
  async userReadNotification(
    notification_id: string,
    userId: string,
  ): Promise<boolean> {
    const marked = await this.markNotificationAsRead(notification_id, {
      _id: notification_id,
      receiverId: userId,
    });
    return marked;
  }

  async userClearNotifications(userId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Request is not from a valid user');

    // delete all notifications for user
    const deleted = await this.notificationModel.deleteMany({
      notification_type: 'USER',
      receiverId: userId,
    });
    if (deleted.deletedCount === 0) {
      throw new NotFoundException('Notification not found');
    }
    return true;
  }

  async resolveNotification(
    admin_id: string,
    message: string,
    notification_id: string,
  ): Promise<string> {
    // Fetch the notification to copy its data
    const notification = await this.notificationModel
      .findById(notification_id)
      .lean()
      .exec();
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Delete the notification
    const deleted = await this.deleteNotification(notification_id);
    if (!deleted) {
      throw new InternalServerErrorException('Error deleting notification');
    }
    // TODO: use notification to create audit file with admin id

    return '';
  }
}
