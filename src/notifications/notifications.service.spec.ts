import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { NotificationsService } from './notifications.service';
import { Notification } from 'src/shared/schema/notification.schema';
import { UserRole } from 'src/shared/interfaces/user.type';
import { CreateNotificationDto } from './dtos/create-notification.dto';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let modelMock: any;

  const mockNotification = {
    _id: new Types.ObjectId(),
    message: 'Test Message',
    link: 'https://test.com',
    targetType: 'ALL',
    targetRoles: [],
    targetUsers: [],
    readBy: [],
    createdAt: new Date(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    mockNotification.save.mockReset();

    // Mock Mongoose model methods
    modelMock = jest.fn().mockImplementation(() => mockNotification);
    modelMock.find = jest.fn();
    modelMock.findByIdAndUpdate = jest.fn();
    modelMock.countDocuments = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: Notification.name,
          useValue: modelMock,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('createNotification', () => {
    it('should create and save a new notification', async () => {
      const dto: CreateNotificationDto = {
        message: 'Direct Message',
        targetType: 'USER',
        targetUsers: [new Types.ObjectId().toString()],
      };

      const savedDoc = { ...mockNotification, ...dto };
      mockNotification.save.mockResolvedValue(savedDoc);

      const result = await service.createNotification(dto);

      expect(result).toEqual(savedDoc);
      expect(mockNotification.save).toHaveBeenCalled();
    });
  });

  describe('getUserNotifications', () => {
    it('should query targeted notifications and append isRead status', async () => {
      const userId = new Types.ObjectId().toString();
      const mockDbResult = [
        {
          _id: new Types.ObjectId(),
          message: 'Public Notification',
          link: '',
          targetType: 'ALL',
          readBy: [new Types.ObjectId(userId)],
          createdAt: new Date(),
        },
        {
          _id: new Types.ObjectId(),
          message: 'Unread Targeted Notification',
          link: '',
          targetType: 'USER',
          readBy: [],
          createdAt: new Date(),
        },
      ];

      const findMock = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDbResult),
      };
      modelMock.find.mockReturnValue(findMock);

      const result = await service.getUserNotifications(userId, [UserRole.USER]);

      expect(result).toHaveLength(2);
      expect(result[0].isRead).toBe(true);
      expect(result[1].isRead).toBe(false);
      expect(modelMock.find).toHaveBeenCalledWith({
        $or: [
          { targetType: 'ALL' },
          { targetType: 'ROLE', targetRoles: { $in: [UserRole.USER] } },
          { targetType: 'USER', targetUsers: new Types.ObjectId(userId) },
        ],
      });
    });
  });

  describe('markAsRead', () => {
    it('should add userId to readBy using $addToSet', async () => {
      const userId = new Types.ObjectId().toString();
      const notificationId = new Types.ObjectId().toString();

      const updateMock = {
        exec: jest.fn().mockResolvedValue({ _id: notificationId }),
      };
      modelMock.findByIdAndUpdate.mockReturnValue(updateMock);

      const result = await service.markAsRead(userId, notificationId);

      expect(result).toEqual({ success: true });
      expect(modelMock.findByIdAndUpdate).toHaveBeenCalledWith(
        notificationId,
        { $addToSet: { readBy: new Types.ObjectId(userId) } },
        { new: true },
      );
    });
  });
});
