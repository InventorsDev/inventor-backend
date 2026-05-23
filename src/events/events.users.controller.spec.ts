import { Test, TestingModule } from '@nestjs/testing';
import mongoose from 'mongoose';
import { TestModule } from 'src/shared/testkits';
import { EventDto } from './dto/event.dto';
import { UpdateEventDto } from './dto/updateEvent.dto';
import { EventUserController } from './events.users.controller';
import { EventService } from './events.users.service';

describe('EventUserController', () => {
  let controller: EventUserController;
  let service: jest.Mocked<EventService>;

  const mockEvent = { id: '1', title: 'Sample Event', admin_id: 'admin_id' };

  afterEach(async () => {
    jest.clearAllMocks();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    const mockEventService: Partial<jest.Mocked<EventService>> = {
      createEvent: jest.fn().mockResolvedValue(mockEvent),
      findAll: jest.fn().mockResolvedValue([mockEvent]),
      findById: jest.fn().mockResolvedValue(mockEvent),
      updateEvent: jest.fn().mockResolvedValue(mockEvent),
      softDeleteEvent: jest.fn().mockResolvedValue(mockEvent),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
      controllers: [EventUserController],
      providers: [
        {
          provide: EventService,
          useValue: mockEventService,
        },
      ],
    }).compile();

    controller = module.get<EventUserController>(EventUserController);
    service = module.get(EventService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create event', async () => {
    const dto: EventDto = { title: 'Sample Event' } as any;
    const result = await controller.createEvent(dto);
    expect(service.createEvent).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockEvent);
  });

  it('should get all events', async () => {
    const req = { user: { id: 'user1' } } as any;
    const result = await controller.getAllEvents(req);
    expect(service.findAll).toHaveBeenCalledWith(req);
    expect(result).toEqual([mockEvent]);
  });

  it('should get event by id', async () => {
    const result = await controller.getEventById('1');
    expect(service.findById).toHaveBeenCalledWith('1');
    expect(result).toEqual(mockEvent);
  });

  it('should update event', async () => {
    const dto: UpdateEventDto = { title: 'Updated Event' } as any;
    const result = await controller.updateEvent('1', dto);
    expect(service.updateEvent).toHaveBeenCalledWith('1', dto);
    expect(result).toEqual(mockEvent);
  });

  it('should delete event', async () => {
    const result = await controller.deleteEvent('1');
    expect(service.softDeleteEvent).toHaveBeenCalledWith('1');
    expect(result).toEqual(mockEvent);
  });
});
