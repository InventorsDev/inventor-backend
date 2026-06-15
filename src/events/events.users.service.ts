import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { Event } from 'src/shared/schema';
import { EventDocument } from 'src/shared/schema/events.schema';
import { EventDto } from './dto/event.dto';
import { ApiReq, UserRole } from 'src/shared/interfaces';
import { getPagingParams, getPaginated } from 'src/shared/utils';
import { UpdateEventDto } from './dto/updateEvent.dto';
import { Status } from 'src/shared/interfaces/event.type';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    @Inject(Event.name)
    private readonly eventModel: Model<EventDocument>,
  ) {}

  async createEvent(payload: EventDto, createdBy: string): Promise<Event> {
    this.logger.log(`Creating event "${payload.title}" by ${createdBy}`);
    // global whitelist ValidationPipe already strips unknown props
    return this.eventModel.create({ ...payload, createdBy, status: Status.PENDING });
  }

  // public listing -> approved events only (never PENDING/DELETED)
  async findAll(req: ApiReq) {
    const { page, currentLimit, skip, order, dbQuery } = getPagingParams(req, {
      status: Status.APPROVED,
    });
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

  // admin listing -> all events, optionally filtered by a single status
  async findAllForAdmin(req: ApiReq, status?: Status) {
    if (status && !Object.values(Status).includes(status)) {
      throw new BadRequestException(`Invalid status "${status}"`);
    }
    this.logger.log(`Admin listing events${status ? ` (status=${status})` : ''}`);
    const { page, currentLimit, skip, order, dbQuery } = getPagingParams(
      req,
      status ? { status } : null,
    );
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
    const event = await this.eventModel
      .findOne({ _id: id, status: { $ne: Status.DELETED } })
      .lean()
      .exec();
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  async updateEvent(
    id: string,
    updateEventDto: UpdateEventDto,
    req: ApiReq,
  ): Promise<EventDocument> {
    await this.assertCanMutate(id, req);
    this.logger.log(`Updating event ${id}`);
    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(id, updateEventDto, { new: true, lean: true })
      .exec();
    if (!updatedEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return updatedEvent;
  }

  async softDeleteEvent(id: string, req: ApiReq): Promise<Event> {
    await this.assertCanMutate(id, req);
    this.logger.log(`Soft-deleting event ${id}`);
    const deletedEvent = await this.eventModel
      .findByIdAndUpdate(id, { status: Status.DELETED }, { new: true, lean: true })
      .exec();
    if (!deletedEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return deletedEvent;
  }

  // admin-only (guarded at the controller); approves a pending event
  async approveEvent(id: string): Promise<Event> {
    this.logger.log(`Approving event ${id}`);
    const approvedEvent = await this.eventModel
      .findByIdAndUpdate(id, { status: Status.APPROVED }, { new: true, lean: true })
      .exec();
    if (!approvedEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return approvedEvent;
  }

  // owner-or-admin guard for mutations; throws 404/403 as appropriate
  private async assertCanMutate(id: string, req: ApiReq): Promise<void> {
    const event = await this.eventModel
      .findById(id)
      .select('createdBy')
      .lean()
      .exec();
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    const roles: UserRole[] = req.user?.role ?? [];
    const isAdmin = roles.includes(UserRole.ADMIN);
    const isOwner = event.createdBy?.toString() === req.user?._id?.toString();
    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You are not allowed to modify this event');
    }
  }
}
