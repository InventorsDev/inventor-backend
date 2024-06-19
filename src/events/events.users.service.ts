import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Event } from 'src/shared/schema';
import { EventDocument } from 'src/shared/schema/events.schema';
import { EventDto } from './dto/event.dto';
import { ApiReq } from 'src/shared/interfaces/req.type';
import { getPagingParams, getPaginated } from 'src/shared/utils';
import { UpdateEventDto } from './dto/updateEvent.dto';
import { Status } from 'src/shared/interfaces/event.type';

@Injectable()
export class EventService {
  constructor(
    @Inject(Event.name)
    private readonly eventModel: Model<EventDocument>,
  ) {}

  async createEvent(payload: EventDto): Promise<Event> {
    return this.eventModel.create({ payload });
  }

  async findAll(req: ApiReq) {
    const { page, currentLimit, skip, order, dbQuery } = getPagingParams(req);
    const [records, count] = await Promise.all([
      this.eventModel
        .find(dbQuery, {}, { lean: true })
        .sort({ createdAt: order })
        .skip(skip)
        .limit(currentLimit),
      this.eventModel.countDocuments(dbQuery),
    ]);
    return getPaginated<EventDocument>(
      { page, count, limit: currentLimit },
      records,
    );
  }

  async findById(id: string): Promise<EventDocument> {
    const event = await this.eventModel.findById(id).lean().exec();
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  async updateEvent(
    id: string,
    updateEventDto: UpdateEventDto,
  ): Promise<EventDocument> {
    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(id, updateEventDto, { new: true, lean: true })
      .exec();
      
    if (!updatedEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return updatedEvent;
  }

  async softDeleteEvent(id: string): Promise<Event> {
    let deleteEvent = this.eventModel.findByIdAndUpdate(
      id,
      { status: Status.DELETED },
      { new: true },
    );
    if (!deleteEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return deleteEvent;
  }

  async approveEvent(id: string): Promise<Event> {
    let approveEvent = this.eventModel.findByIdAndUpdate(
      id,
      { status: Status.APPROVED },
      { new: true },
    );
    if (!approveEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return approveEvent;
  }
}
