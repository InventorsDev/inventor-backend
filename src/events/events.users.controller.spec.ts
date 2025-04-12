import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './events.users.service';
import { EventUserController } from './events.users.controller';
import { EventAdminsController } from './events.admin.controller';
import { TestModule } from 'src/shared/testkits';
import { Event } from 'src/shared/schema';
import { EventDocument } from 'src/shared/schema/events.schema';
import { Status } from 'src/shared/interfaces/event.type';

import { Types } from 'mongoose';
import { NotFoundException } from '@nestjs/common';

describe('UsersAdminController', () => {
  let adminController: EventAdminsController;
  let eventService: EventService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventAdminsController],
      providers: [
        {
          provide: EventService,
          useValue: {
            approveEvent: jest.fn(),
            softDeleteEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    adminController = module.get<EventAdminsController>(EventAdminsController);
    eventService = module.get<EventService>(EventService);
  });

  it('should be defined', () => {
    expect(adminController).toBeDefined();
  });

  describe('approveEvent', () => {
    const eventId = 'valid-event-id';

    it('should successfully approve an event', async () => {
      const mockEvent: EventDocument = {
        id: eventId,
        title: 'Tech Conference',
        description: 'A conference about the latest in tech.',
        date: new Date(),
        status: 'APPROVED',
        save: jest.fn(),
        validate: jest.fn(),
        remove: jest.fn(),
        populate: jest.fn(),
      } as unknown as EventDocument;

      jest.spyOn(eventService, 'approveEvent').mockResolvedValue(mockEvent);

      const result = await adminController.approveEvent(eventId);

      expect(result).toEqual(mockEvent);
      expect(eventService.approveEvent).toHaveBeenCalledWith(eventId); // Verify the service method was called with the correct ID
    });

    it('should throw a NotFoundException if the event is not found', async () => {
      jest
        .spyOn(eventService, 'approveEvent')
        .mockRejectedValue(
          new NotFoundException(`Event with ID ${eventId} not found`),
        );

      await expect(adminController.approveEvent(eventId)).rejects.toThrow(
        `Event with ID ${eventId} not found`,
      );
      expect(eventService.approveEvent).toHaveBeenCalledWith(eventId); // Verify the service method was called with the correct ID
    });
  });

  describe('softDeleteEvent', () => {
    const eventId = new Types.ObjectId().toString();

    it('should successfully soft delete an event', async () => {
      const mockEvent: EventDocument = {
        _id: new Types.ObjectId(eventId),
        title: 'Tech Conference',
        description: 'A conference about the latest in tech.',
        date: new Date(),
        status: Status.DELETED,
        save: jest.fn(),
        validate: jest.fn(),
        remove: jest.fn(),
        populate: jest.fn(),
      } as unknown as EventDocument;

      jest.spyOn(eventService, 'softDeleteEvent').mockResolvedValue(mockEvent);

      const result = await adminController.softDeleteEvent(eventId);

      expect(result).toEqual(mockEvent);
      expect(eventService.softDeleteEvent).toHaveBeenCalledWith(eventId);
    });

    it('should throw a NotFoundException if the event is not found', async () => {
      jest
        .spyOn(eventService, 'softDeleteEvent')
        .mockRejectedValue(
          new NotFoundException(`Event with ID ${eventId} not found`),
        );

      await expect(adminController.softDeleteEvent(eventId)).rejects.toThrow(
        `Event with ID ${eventId} not found`,
      );
      expect(eventService.softDeleteEvent).toHaveBeenCalledWith(eventId);
    });
  });
});

describe('UsersController', () => {
  let controller: EventUserController;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
      controllers: [EventUserController],
      providers: [EventService],
    }).compile();

    controller = module.get<EventUserController>(EventUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
