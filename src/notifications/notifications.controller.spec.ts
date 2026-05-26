import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { UserRole } from 'src/shared/interfaces/user.type';
import { ApiReq } from 'src/shared/interfaces';
import { Types } from 'mongoose';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockNotificationsService = {
    getUserNotifications: jest.fn(),
    markAsRead: jest.fn(),
    createNotification: jest.fn(),
    getAdminNotifications: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserNotifications', () => {
    it('should return user notifications', async () => {
      const mockReq = {
        user: {
          _id: new Types.ObjectId(),
          role: [UserRole.USER],
        },
      } as unknown as ApiReq;

      const mockResult = [
        {
          id: 'notif-1',
          message: 'Hello',
          link: 'https://example.com',
          targetType: 'ALL',
          createdAt: new Date(),
          isRead: false,
        },
      ];

      mockNotificationsService.getUserNotifications.mockResolvedValue(mockResult);

      const result = await controller.getUserNotifications(mockReq);

      expect(result).toEqual(mockResult);
      expect(service.getUserNotifications).toHaveBeenCalledWith(
        mockReq.user._id.toString(),
        mockReq.user.role,
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const mockReq = {
        user: {
          _id: new Types.ObjectId(),
        },
      } as unknown as ApiReq;
      const notifId = 'notif-1';
      const mockResult = { success: true };

      mockNotificationsService.markAsRead.mockResolvedValue(mockResult);

      const result = await controller.markAsRead(mockReq, notifId);

      expect(result).toEqual(mockResult);
      expect(service.markAsRead).toHaveBeenCalledWith(
        mockReq.user._id.toString(),
        notifId,
      );
    });
  });

  describe('createNotification', () => {
    it('should create a new notification', async () => {
      const dto: CreateNotificationDto = {
        message: 'Hello Group',
        targetType: 'ROLE',
        targetRoles: [UserRole.LEAD],
      };
      const mockResult = { id: 'notif-2', ...dto };

      mockNotificationsService.createNotification.mockResolvedValue(mockResult);

      const result = await controller.createNotification(dto);

      expect(result).toEqual(mockResult);
      expect(service.createNotification).toHaveBeenCalledWith(dto);
    });
  });

  describe('getAdminNotifications', () => {
    it('should return admin list of notifications', async () => {
      const mockReq = {
        query: { page: '1', limit: '10' },
      } as unknown as ApiReq;
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      mockNotificationsService.getAdminNotifications.mockResolvedValue(mockResult);

      const result = await controller.getAdminNotifications(mockReq);

      expect(result).toEqual(mockResult);
      expect(service.getAdminNotifications).toHaveBeenCalledWith(mockReq);
    });
  });
});
