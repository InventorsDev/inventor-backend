import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let userModel: any;
  let notificationModel: any;
  let notificationAuditModel: any;

  beforeEach(async () => {
    // mokcingi model functions for testing
    userModel = { findById: jest.fn() };
    // mocking the returned value of the to a json object, applying the lean function
    notificationModel = {
      find: jest.fn().mockReturnValue({
        lean: () => {
          exec: jest.fn();
        },
      }),
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
});
