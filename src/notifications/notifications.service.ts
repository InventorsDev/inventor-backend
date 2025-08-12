import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
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
}
