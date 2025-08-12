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
  });
});
