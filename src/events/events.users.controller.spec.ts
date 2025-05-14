import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './events.users.service';
import { EventUserController } from './events.users.controller';
import { TestModule } from 'src/shared/testkits';
import { getModelToken } from '@nestjs/mongoose';
import { JoinMethod, Location, Status } from 'src/shared/interfaces/event.type';
import { Types } from 'mongoose';

describe('UsersController', () => {
  let controller: EventUserController
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
      controllers: [EventUserController],
      providers: [EventService,
        {
          provide: getModelToken(Event.name), 
          useValue: eventModelMock,
        },],
    }).compile();

    controller = module.get<EventUserController>(EventUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
