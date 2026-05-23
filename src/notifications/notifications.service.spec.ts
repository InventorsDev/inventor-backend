import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { NotificationType } from 'src/shared/interfaces';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let userModel: any;
  let notificationModel: any;
  let notificationAuditModel: any;

  beforeEach(async () => {
    // mocking model functions for testing
    userModel = { findById: jest.fn() };
    notificationModel = {
      find: jest.fn().mockReturnValue({
        lean: () => ({
          exec: jest.fn(),
        }),
        sort: jest.fn().mockReturnThis(),
      }),
      findById: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn().mockReturnValue({
        lean: () => ({
          exec: jest.fn(),
        }),
      }),
      create: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
    };
    notificationAuditModel = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: 'NotificationInfo', useValue: notificationModel },
        { provide: 'User', useValue: userModel },
        { provide: 'NotificationAuditInfo', useValue: notificationAuditModel },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('should throw not found exception if user not found', async () => {
    userModel.findById.mockResolvedValue(null);
    await expect(service.getNotifications('123')).rejects.toThrow(
      NotFoundException,
    );
  });
  it('should return admin notifications for admin user', async () => {
    const mockAdminUser = { role: ['ADMIN'] }; // setting example user obj role to admin
    const mockAdminNotifications = [
      { message: 'Test notification 1' },
      { message: 'Test notification 2' },
    ];
    userModel.findById.mockResolvedValue(mockAdminUser);
    // mocking the returned value to give an array of javascript objects
    notificationModel.find.mockReturnValue({
      lean: () => ({
        exec: jest.fn().mockResolvedValue(mockAdminNotifications),
      }),
    });
    const result = await service.getNotifications('admin-user-id');
    expect(result).toEqual(mockAdminNotifications);
    expect(notificationModel.find).toHaveBeenCalledWith({
      isAdminNotification: true,
    });
  });

  it('should return all notifications for user', async () => {
    const mockUser = { role: ['USER'], _id: 'user-id' };
    const mockUserNotification = [{ message: 'Test notification 1' }];
    userModel.findById.mockResolvedValue(mockUser);
    notificationModel.find.mockReturnValue({
      lean: () => ({
        exec: jest.fn().mockResolvedValue(mockUserNotification),
      }),
    });
    const result = await service.getNotifications(mockUser._id.toString());
    expect(result).toEqual(mockUserNotification);
    expect(notificationModel.find).toHaveBeenCalledWith({
      receiverId: mockUser._id.toString(),
    });
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const mockNotification = { _id: 'notification-id' };
      notificationModel.create.mockResolvedValue(mockNotification);

      const notificationDto = {
        receiverId: 'user-id',
        notification_type: NotificationType.Leads,
        entityId: 'entity-id',
        message: 'Test notification',
        data: { test: 'data' },
        isRead: false,
        isAdminNotification: false,
      };

      const result = await service.createNotification(notificationDto);
      expect(result).toBe('notification-id');
      expect(notificationModel.create).toHaveBeenCalledWith(notificationDto);
    });

    it('should throw InternalServerErrorException if notification creation fails', async () => {
      notificationModel.create.mockResolvedValue({ _id: undefined });

      const notificationDto = {
        receiverId: 'user-id',
        notification_type: NotificationType.Leads,
        entityId: 'entity-id',
        message: 'Test notification',
        data: { test: 'data' },
        isRead: false,
        isAdminNotification: false,
      };

      await expect(service.createNotification(notificationDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark notification as read successfully', async () => {
      const validObjectId = '507f1f77bcf86cd799439011';
      const mockNotification = { _id: validObjectId, isRead: true };
      notificationModel.findOneAndUpdate.mockReturnValue({
        lean: () => ({
          exec: jest.fn().mockResolvedValue(mockNotification),
        }),
      });

      const result = await service.markNotificationAsRead(validObjectId, {
        _id: validObjectId,
      });
      expect(result).toBe(true);
    });

    it('should throw NotFoundException for invalid ObjectId', async () => {
      await expect(
        service.markNotificationAsRead('invalid-id', { _id: 'invalid-id' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if notification not found', async () => {
      const validObjectId = '507f1f77bcf86cd799439012';
      notificationModel.findOneAndUpdate.mockReturnValue({
        lean: () => ({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(
        service.markNotificationAsRead(validObjectId, { _id: validObjectId }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAdminNotifications', () => {
    it('should return all admin notifications when no status filter', async () => {
      const mockNotifications = [
        { _id: '1', message: 'Admin notification 1' },
        { _id: '2', message: 'Admin notification 2' },
      ];
      
      notificationModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: () => ({
            exec: jest.fn().mockResolvedValue(mockNotifications),
          }),
        }),
      });

      const result = await service.getAdminNotifications();
      expect(result).toEqual(mockNotifications);
      expect(notificationModel.find).toHaveBeenCalledWith({
        isAdminNotification: true,
      });
    });

    it('should filter by pending status', async () => {
      const mockNotifications = [{ _id: '1', message: 'Pending notification' }];
      
      notificationModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: () => ({
            exec: jest.fn().mockResolvedValue(mockNotifications),
          }),
        }),
      });

      const result = await service.getAdminNotifications('pending');
      expect(result).toEqual(mockNotifications);
      expect(notificationModel.find).toHaveBeenCalledWith({
        isAdminNotification: true,
        isRead: false,
      });
    });
  });

  describe('createAdminNotificationForNewRequest', () => {
    it('should create admin notification for new request', async () => {
      notificationModel.create.mockResolvedValue({ _id: 'notification-id' });

      await service.createAdminNotificationForNewRequest(
        'entity-id',
        NotificationType.Leads,
        'Test message',
        { test: 'data' },
      );

      expect(notificationModel.create).toHaveBeenCalledWith({
        receiverId: 'ADMIN',
        notification_type: NotificationType.Leads,
        entityId: 'entity-id',
        message: 'Test message',
        data: { test: 'data' },
        isRead: false,
        isAdminNotification: true,
      });
    });
  });

  describe('resolveNotification', () => {
    it('should resolve notification and create audit log', async () => {
      const mockNotification = {
        _id: 'notification-id',
        message: 'Test notification',
        notification_type: NotificationType.Leads,
        entityId: 'entity-id',
      };

      notificationModel.findById.mockReturnValue({
        lean: () => ({
          exec: jest.fn().mockResolvedValue(mockNotification),
        }),
      });
      notificationModel.deleteOne.mockResolvedValue({ deletedCount: 1 });
      notificationAuditModel.create.mockResolvedValue({});

      const result = await service.resolveNotification(
        'notification-id',
        'admin-id',
        'Resolution message',
        'APPROVED',
      );

      expect(result).toBe('Notification resolved successfully');
      expect(notificationAuditModel.create).toHaveBeenCalledWith({
        actorId: 'admin-id',
        notificationSummary: 'Test notification',
        resolutionMessage: 'Resolution message',
        resolutionStatus: 'APPROVED',
        entityType: NotificationType.Leads,
        entityId: 'entity-id',
      });
    });
  });
});
