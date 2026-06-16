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
import { getPaginated, getPagingParams } from 'src/shared/utils';
import { UpdateEventDto } from './dto/updateEvent.dto';
import { Status } from 'src/shared/interfaces/event.type';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    @Inject(Event.name)
    private readonly eventModel: Model<EventDocument>,
  ) {}

  // fields only an admin may change; owners are limited to content + schedule
  private static readonly ADMIN_ONLY_FIELDS: (keyof UpdateEventDto)[] = [
    'title',
    'host',
  ];

  async createEvent(payload: EventDto, createdBy: string): Promise<Event> {
    this.logger.log(`Creating event "${payload.title}" by ${createdBy}`);
    // global whitelist ValidationPipe already strips unknown props
    return this.eventModel.create({
      ...payload,
      createdBy,
      status: Status.PENDING,
    });
  }

  // public listing -> approved events only (never PENDING/DELETED)
  async findAll(req: ApiReq) {
    const { page, currentLimit, skip, order, dbQuery } = getPagingParams(req, {
      status: Status.APPROVED,
    });
    this.logger.log(
      `Public event listing: query=${JSON.stringify(dbQuery)} page=${page} limit=${currentLimit}`,
    );
    const [records, count] = await Promise.all([
      this.eventModel
        .find(dbQuery, {}, { lean: true })
        .sort({ createdAt: order })
        .skip(skip)
        .limit(currentLimit),
      this.eventModel.countDocuments(dbQuery),
    ]);
    this.logger.log(
      `Public event listing: matched ${count} APPROVED event(s), returning ${records.length}`,
    );
    if (count === 0) {
      const total = await this.eventModel.estimatedDocumentCount();
      this.logger.warn(
        `No APPROVED events found (total events in collection: ${total}). ` +
          `Newly created events are PENDING until an admin approves them via PATCH /admins/event/:id/approve.`,
      );
    }
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

  // admin listing -> all events, optionally filtered by a single status
  async findAllForAdmin(req: ApiReq, status?: Status) {
    if (status && !Object.values(Status).includes(status)) {
      throw new BadRequestException(`Invalid status "${status}"`);
    }
    this.logger.log(
      `Admin listing events${status ? ` (status=${status})` : ''}`,
    );
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

  async updateEvent(
    id: string,
    updateEventDto: UpdateEventDto,
    req: ApiReq,
  ): Promise<EventDocument> {
    const { isAdmin } = await this.assertCanMutate(id, req);

    // owner (non-admin) cannot touch identity fields
    if (!isAdmin) {
      const blocked = EventService.ADMIN_ONLY_FIELDS.filter(
        (f) => updateEventDto[f] !== undefined,
      );
      if (blocked.length) {
        this.logger.warn(
          `Owner ${req.user?._id} blocked from editing admin-only fields on ${id}: ${blocked.join(', ')}`,
        );
        throw new ForbiddenException(
          `Only an admin can edit: ${blocked.join(', ')}`,
        );
      }
    }

    this.logger.log(
      `Updating event ${id} (admin=${isAdmin}, fields=${Object.keys(updateEventDto).join(',') || 'none'})`,
    );
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
      .findByIdAndUpdate(
        id,
        { status: Status.DELETED },
        { new: true, lean: true },
      )
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
      .findByIdAndUpdate(
        id,
        { status: Status.APPROVED },
        { new: true, lean: true },
      )
      .exec();
    if (!approvedEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return approvedEvent;
  }

  // owner-or-admin guard for mutations; throws 404/403, returns the caller tier
  private async assertCanMutate(
    id: string,
    req: ApiReq,
  ): Promise<{ isAdmin: boolean; isOwner: boolean }> {
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
    return { isAdmin, isOwner };
  }
}
