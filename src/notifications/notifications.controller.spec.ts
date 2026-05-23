import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  beforeEach(async () => {
    const mockNotificationService = {
      getNotifications: jest
        .fn()
        .mockResolvedValue([
          { message: 'Test notification 1' },
          { message: 'Test notification 2' },
        ]),
      getNotificationById: jest
        .fn()
        .mockResolvedValue({ notificationId: 'id', parentId: 'parent-id' }),
      userReadNotification: jest.fn().mockResolvedValue(true),
      userClearNotifications: jest.fn().mockResolvedValue(true),
      getAdminNotifications: jest.fn().mockResolvedValue([
        { message: 'Admin notification 1' },
        { message: 'Admin notification 2' },
      ]),
      adminReadNotification: jest.fn().mockResolvedValue(true),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: mockNotificationService },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return notifications', async () => {
    const req = { user: { _id: 1234 } } as any;
    const result = await controller.getNotifications(req);
    expect(result).toEqual([
      { message: 'Test notification 1' },
      { message: 'Test notification 2' },
    ]);
    expect(service.getNotifications).toHaveBeenCalledWith('1234');
  });

  it('should get notification parent id', async () => {
    const result = await controller.getNotificationParentId('notification-id');
    expect(result).toEqual({ notificationId: 'id', parentId: 'parent-id' });
    expect(service.getNotificationById).toHaveBeenCalledWith('notification-id');
  });

  it('should mark notification as read', async () => {
    const req = { user: { _id: 'user-id' } } as any;
    const result = await controller.markNotificationAsRead('notification-id', req);
    expect(result).toBe(true);
    expect(service.userReadNotification).toHaveBeenCalledWith(
      'notification-id',
      'user-id',
    );
  });

  it('should clear user notifications', async () => {
    const req = { user: { _id: 'user-id' } } as any;
    const result = await controller.clearUserNotifications(req);
    expect(result).toBe(true);
    expect(service.userClearNotifications).toHaveBeenCalledWith('user-id');
  });

  it('should get admin notifications', async () => {
    const result = await controller.getAdminNotifications('pending');
    expect(result).toEqual([
      { message: 'Admin notification 1' },
      { message: 'Admin notification 2' },
    ]);
    expect(service.getAdminNotifications).toHaveBeenCalledWith('pending');
  });

  it('should mark admin notification as read', async () => {
    const result = await controller.markAdminNotificationAsRead('notification-id');
    expect(result).toBe(true);
    expect(service.adminReadNotification).toHaveBeenCalledWith('notification-id');
  });
});
