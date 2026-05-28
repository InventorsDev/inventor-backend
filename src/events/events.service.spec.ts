import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './events.users.service';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { EventDto } from './dto/event.dto';
import { UpdateEventDto } from './dto/updateEvent.dto';
import { JoinMethod, Location, Status } from 'src/shared/interfaces/event.type';
import { TestModule } from 'src/shared/testkits';

describe('EventService', () => {
  let service: EventService;

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
    eventDate: new Date()
  };

  let eventModelMock = {
    create: jest.fn().mockResolvedValue(mockEvent),
    findById: jest.fn().mockImplementationOnce(() => ({
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockEvent),
    })),
    findByIdAndUpdate: jest.fn().mockImplementationOnce(() => ({
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockEvent),
    })),
    countDocuments: jest.fn(),
    find: jest.fn().mockImplementationOnce(() => ({
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockEvent),
    })),
  };


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
      providers: [
        EventService,
        {
          provide: 'Event',
          useValue: eventModelMock,
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEvent', () => {
    it('should create and return an event', async () => {
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
        socialsLinks: { linkedIn: 'linkedin_url', twitter: 'twitter_url', facebook: 'facebook_url' },
        eventDate: new Date(),
      };

      const result = await service.createEvent(eventDto);
      expect(eventModelMock.create).toHaveBeenCalledWith(eventDto);
      expect(result).toEqual(mockEvent);
    });
  });

  describe('findById', () => {
    it('should return an event by ID', async () => {
      const result = await service.findById(mockEvent._id.toString());
      expect(result).toEqual(mockEvent);
      expect(eventModelMock.findById).toHaveBeenCalledWith(mockEvent._id.toString());
    });

    it('should throw NotFoundException if event is not found', async () => {
      eventModelMock.findById.mockImplementationOnce(() => ({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)}));
      await expect(service.findById('12345')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateEvent', () => {
    it('should update and return an event', async () => {
      const updateEventDto: UpdateEventDto = { title: 'Updated Event' };
      eventModelMock.findByIdAndUpdate.mockResolvedValue(mockEvent);
      const result = await service.updateEvent(mockEvent._id.toString(), updateEventDto);
      expect(result).toEqual(mockEvent);
      expect(eventModelMock.findByIdAndUpdate).toHaveBeenCalledWith(mockEvent._id.toString(), updateEventDto, { new: true, lean: true });
    });

    it('should throw NotFoundException if event to update is not found', async () => {
      eventModelMock.findByIdAndUpdate.mockImplementationOnce(() => ({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)}));
      await expect(service.updateEvent('12345', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDeleteEvent', () => {
    it('should soft delete an event', async () => {
      eventModelMock.findByIdAndUpdate.mockResolvedValue(mockEvent);
      const result = await service.softDeleteEvent(mockEvent._id.toString());
      expect(result).toEqual(mockEvent);
      expect(eventModelMock.findByIdAndUpdate).toHaveBeenCalledWith(mockEvent._id.toString(), { status: Status.DELETED }, { new: true });
    });

    it('should throw NotFoundException if event to delete is not found', async () => {
      let id = mockEvent._id.toString();
      eventModelMock.findByIdAndUpdate.mockRejectedValueOnce(new NotFoundException(`Event with ID ${id} not found`));
      await expect(service.softDeleteEvent(id)).rejects.toThrow(new NotFoundException(`Event with ID ${id} not found`));
    });
  });

  describe('approveEvent', () => {
    it('should approve an event', async () => {
      eventModelMock.findByIdAndUpdate.mockResolvedValue(mockEvent);
      const result = await service.approveEvent(mockEvent._id.toString());
      expect(result).toEqual(mockEvent);
      expect(eventModelMock.findByIdAndUpdate).toHaveBeenCalledWith(mockEvent._id.toString(), { status: Status.APPROVED }, { new: true });
    });

    it('should throw NotFoundException if event to approve is not found', async () => {
      let id = mockEvent._id.toString();
      eventModelMock.findByIdAndUpdate.mockRejectedValueOnce(new NotFoundException(`Event with ID ${id} not found`));
      await expect(service.approveEvent(id)).rejects.toThrow(new NotFoundException(`Event with ID ${id} not found`));
    });
  });
});
