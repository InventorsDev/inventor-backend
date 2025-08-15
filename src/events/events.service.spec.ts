import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import mongoose, { Types } from 'mongoose';
import { NotificationsService } from 'src/notifications/notifications.service';
import { JoinMethod, Location, Status } from 'src/shared/interfaces/event.type';
import { EventDto } from './dto/event.dto';
import { UpdateEventDto } from './dto/updateEvent.dto';
import { EventService } from './events.users.service';

describe('EventService', () => {
  let service: EventService;
  let eventModelMock: any;
  let notificationsServiceMock: any;

  const mockEvent = {
    _id: new Types.ObjectId(),
    title: 'Sample Event',
    shortDesc: 'A short description',
    description: 'A detailed description of the event',
    host: 'Host Name',
    coHost: ['Co-host One', 'Co-host Two'],
    location: Location.PHYSICAL,
    photo: 'https://example.com/photo.jpg',
    joinMethod: JoinMethod.MEET,
    link: 'https://example.com/event',
    socialsLinks: {
      linkedIn: 'https://linkedin.com/in/sample',
      twitter: 'https://twitter.com/sample',
      facebook: 'https://facebook.com/sample',
    },
    eventDate: new Date(),
    status: Status.PENDING,
  };

  afterEach(async () => {
    jest.clearAllMocks();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    eventModelMock = {
      create: jest.fn().mockResolvedValue(mockEvent),
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEvent),
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEvent),
      }),
      countDocuments: jest.fn().mockResolvedValue(1),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockEvent]),
      }),
    };

    notificationsServiceMock = {
      createNotification: jest.fn().mockResolvedValue(undefined),
      getNotificationByUserId: jest.fn().mockResolvedValue(undefined),
      resolveNotification: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        { provide: Event.name, useValue: eventModelMock },
        { provide: NotificationsService, useValue: notificationsServiceMock },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEvent', () => {
    it('should create an event and send notification', async () => {
      const eventDto: EventDto = {
        title: 'Sample Event',
        shortDesc: 'Short description',
        description: 'Event description',
        host: 'Host',
        coHost: ['Co-host 1', 'Co-host 2'],
        location: Location.ONLINE,
        photo: 'photo_url',
        joinMethod: JoinMethod.MEET,
        link: 'event_link',
        socialsLinks: {
          linkedIn: 'linkedin_url',
          twitter: 'twitter_url',
          facebook: 'facebook_url',
        },
        eventDate: new Date(),
      };

      const result = await service.createEvent(eventDto);

      expect(eventModelMock.create).toHaveBeenCalledWith(
        expect.objectContaining(eventDto),
      );
      expect(notificationsServiceMock.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          receiverId: eventDto.host,
          message: expect.stringContaining(eventDto.title),
        }),
      );
      expect(result).toEqual(mockEvent);
    });
  });

  describe('findById', () => {
    it('should return event', async () => {
      const result = await service.findById(mockEvent._id.toString());
      expect(result).toEqual(mockEvent);
      expect(eventModelMock.findById).toHaveBeenCalledWith(
        mockEvent._id.toString(),
      );
    });

    it('should throw if not found', async () => {
      eventModelMock.findById.mockReturnValueOnce({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findById('badid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateEvent', () => {
    it('should update and return event', async () => {
      const dto: UpdateEventDto = { title: 'Updated Event' };
      const result = await service.updateEvent(mockEvent._id.toString(), dto);
      expect(result).toEqual(mockEvent);
      expect(eventModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
        mockEvent._id.toString(),
        dto,
        { new: true, lean: true },
      );
    });

    it('should throw if not found', async () => {
      eventModelMock.findByIdAndUpdate.mockReturnValueOnce({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.updateEvent('badid', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('softDeleteEvent', () => {
    it('should soft delete an event', async () => {
      eventModelMock.findByIdAndUpdate.mockResolvedValueOnce(mockEvent); // direct return
      const result = await service.softDeleteEvent(mockEvent._id.toString());
      expect(result).toEqual(mockEvent);
      expect(eventModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
        mockEvent._id.toString(),
        { status: Status.DELETED },
        { new: true },
      );
    });
  });

  describe('approveEvent', () => {
    it('should approve an event and resolve notification', async () => {
      const admin_id = 'admin_id';
      const message = 'event approved';

      // Mock findByIdAndUpdate to resolve with updated event
      eventModelMock.findByIdAndUpdate = jest.fn().mockResolvedValue(mockEvent);

      // Mock findById to return the same event
      eventModelMock.findById = jest.fn().mockResolvedValue(mockEvent);

      // Mock notifications
      notificationsServiceMock.getNotificationByUserId = jest
        .fn()
        .mockResolvedValue({ _id: 'notif_id' });
      notificationsServiceMock.resolveNotification = jest
        .fn()
        .mockResolvedValue(undefined);

      const result = await service.approveEvent(
        mockEvent._id.toString(),
        admin_id,
        message,
      );

      expect(result).toEqual(mockEvent);
      expect(eventModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
        mockEvent._id.toString(),
        { status: Status.APPROVED },
        { new: true },
      );
      expect(eventModelMock.findById).toHaveBeenCalledWith({
        _id: mockEvent._id.toString(),
      });
      expect(
        notificationsServiceMock.getNotificationByUserId,
      ).toHaveBeenCalledWith(mockEvent.host, mockEvent._id.toString());
      expect(notificationsServiceMock.resolveNotification).toHaveBeenCalledWith(
        'notif_id',
        admin_id,
        message,
        'APPROVED',
      );
    });

    it('should throw NotFoundException if event not found', async () => {
      eventModelMock.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      await expect(
        service.approveEvent(mockEvent._id.toString(), 'admin_id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
