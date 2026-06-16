import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './events.users.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { EventDto } from './dto/event.dto';
import { UpdateEventDto } from './dto/updateEvent.dto';
import { JoinMethod, Location, Status } from 'src/shared/interfaces/event.type';
import { ApiReq, UserRole } from 'src/shared/interfaces';
import { TestModule } from 'src/shared/testkits';

// chainable mongoose query mock: every chain method returns `this`,
// and the query is both awaitable and `.exec()`-able.
const makeQuery = (result: any) => {
  const q: any = {
    select: jest.fn(() => q),
    lean: jest.fn(() => q),
    sort: jest.fn(() => q),
    skip: jest.fn(() => q),
    limit: jest.fn(() => q),
    exec: jest.fn(() => Promise.resolve(result)),
    then: (resolve: any) => Promise.resolve(result).then(resolve),
  };
  return q;
};

describe('EventService', () => {
  let service: EventService;

  const ownerId = new Types.ObjectId();
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
    eventDate: new Date().toISOString(),
    createdBy: ownerId,
  };

  // admin requester -> passes ownership checks via isAdmin bypass
  const adminReq = {
    user: { _id: new Types.ObjectId().toString(), role: [UserRole.ADMIN] },
  } as unknown as ApiReq;

  let eventModelMock: any;

  beforeEach(async () => {
    eventModelMock = {
      create: jest.fn().mockResolvedValue(mockEvent),
      findOne: jest.fn(() => makeQuery(mockEvent)),
      findById: jest.fn(() => makeQuery(mockEvent)),
      findByIdAndUpdate: jest.fn(() => makeQuery(mockEvent)),
      find: jest.fn(() => makeQuery([mockEvent])),
      countDocuments: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
      providers: [EventService, { provide: 'Event', useValue: eventModelMock }],
    }).compile();

    service = module.get<EventService>(EventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEvent', () => {
    it('should create an event with creator and PENDING status', async () => {
      const eventDto: EventDto = {
        title: 'Sample Event',
        shortDesc: 'Short description',
        description: 'Event description',
        host: 'Host',
        coHost: ['Co-host 1'],
        location: Location.ONLINE,
        photo: 'photo_url',
        joinMethod: JoinMethod.MEET,
        link: 'event_link',
        socialsLinks: { linkedIn: 'l', twitter: 't', facebook: 'f' },
        eventDate: new Date().toISOString(),
      };

      const result = await service.createEvent(eventDto, ownerId.toString());
      expect(eventModelMock.create).toHaveBeenCalledWith({
        ...eventDto,
        createdBy: ownerId.toString(),
        status: Status.PENDING,
      });
      expect(result).toEqual(mockEvent);
    });
  });

  describe('findById', () => {
    it('should return a non-deleted event by ID', async () => {
      const result = await service.findById(mockEvent._id.toString());
      expect(result).toEqual(mockEvent);
      expect(eventModelMock.findOne).toHaveBeenCalledWith({
        _id: mockEvent._id.toString(),
        status: { $ne: Status.DELETED },
      });
    });

    it('should throw NotFoundException if event is not found', async () => {
      eventModelMock.findOne.mockReturnValueOnce(makeQuery(null));
      await expect(service.findById('12345')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateEvent', () => {
    it('should update and return an event', async () => {
      const dto: UpdateEventDto = { title: 'Updated Event' };
      const result = await service.updateEvent(
        mockEvent._id.toString(),
        dto,
        adminReq,
      );
      expect(result).toEqual(mockEvent);
      expect(eventModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
        mockEvent._id.toString(),
        dto,
        { new: true, lean: true },
      );
    });

    it('should forbid a non-owner non-admin from updating', async () => {
      const strangerReq = {
        user: { _id: new Types.ObjectId().toString(), role: [UserRole.USER] },
      } as unknown as ApiReq;
      await expect(
        service.updateEvent(mockEvent._id.toString(), {}, strangerReq),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('softDeleteEvent', () => {
    it('should soft delete an event', async () => {
      const result = await service.softDeleteEvent(
        mockEvent._id.toString(),
        adminReq,
      );
      expect(result).toEqual(mockEvent);
      expect(eventModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
        mockEvent._id.toString(),
        { status: Status.DELETED },
        { new: true, lean: true },
      );
    });

    it('should throw NotFoundException if event to delete is not found', async () => {
      eventModelMock.findById.mockReturnValueOnce(makeQuery(null));
      await expect(service.softDeleteEvent('12345', adminReq)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('approveEvent', () => {
    it('should approve an event', async () => {
      const result = await service.approveEvent(mockEvent._id.toString());
      expect(result).toEqual(mockEvent);
      expect(eventModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
        mockEvent._id.toString(),
        { status: Status.APPROVED },
        { new: true, lean: true },
      );
    });

    it('should throw NotFoundException if event to approve is not found', async () => {
      eventModelMock.findByIdAndUpdate.mockReturnValueOnce(makeQuery(null));
      await expect(service.approveEvent('12345')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
