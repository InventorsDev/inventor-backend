import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/shared/interfaces';
import { Status } from 'src/shared/interfaces/event.type';
import { ApiReq } from 'src/shared/interfaces/req.type';
import { Event } from 'src/shared/schema';
import { EventDocument } from 'src/shared/schema/events.schema';
import { getPaginated, getPagingParams } from 'src/shared/utils';
import { EventDto } from './dto/event.dto';
import { UpdateEventDto } from './dto/updateEvent.dto';

@Injectable()
export class EventService {
  constructor(
    @Inject(Event.name)
    private readonly eventModel: Model<EventDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createEvent(payload: EventDto): Promise<Event> {
    const event = await this.eventModel.create({
      title: payload.title,
      shortDesc: payload.shortDesc,
      description: payload.description,
      host: payload.host,
      coHost: payload.coHost,
      location: payload.location,
      photo: payload.photo,
      joinMethod: payload.joinMethod,
      link: payload.link,
      socialsLinks: payload.socialsLinks,
      eventDate: payload.eventDate,
    });

    await this.notificationsService.createNotification({
      receiverId: payload.host,
      notification_type: NotificationType.events,
      entityId: event._id.toString(),
      message: `New event ${event.title} has been created`,
      data: {
        eventTitle: event.title,
        eventDescription: event.description,
        eventLocation: event.location,
        eventDate: event.eventDate,
      },
      isRead: false,
      isAdminNotification: true,
    });

    return event;
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

  async approveEvent(
    id: string,
    admin_id: string,
    message: string = 'event approved',
  ): Promise<Event> {
    const approveEvent = await this.eventModel.findByIdAndUpdate(
      id,
      { status: Status.APPROVED },
      { new: true },
    );

    if (!approveEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    const event = await this.eventModel.findById({ _id: id });
    //TODO: move event to audit
    const existingNotification =
      await this.notificationsService.getNotificationByUserId(
        event.host,
        event._id.toString(),
      );
    await this.notificationsService.resolveNotification(
      existingNotification._id.toString(),
      admin_id,
      message,
      'APPROVED',
    );
    
    // Notify other admins about the resolution
    await this.notificationsService.notifyOtherAdminsOfResolution(
      event._id.toString(),
      admin_id,
      'approved',
      NotificationType.events,
    );
    
    return approveEvent;
  }

  async rejectEvent(
    id: string,
    admin_id: string,
    message: string = 'Event rejected',
  ): Promise<Event> {
    const rejectEvent = await this.eventModel.findByIdAndUpdate(
      id,
      { status: Status.REJECTED },
      { new: true },
    );

    if (!rejectEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    const event = await this.eventModel.findById({ _id: id });
    const existingNotification =
      await this.notificationsService.getNotificationByUserId(
        event.host,
        event._id.toString(),
      );
    await this.notificationsService.resolveNotification(
      existingNotification._id.toString(),
      admin_id,
      message,
      'REJECTED',
    );
    
    // Notify other admins about the resolution
    await this.notificationsService.notifyOtherAdminsOfResolution(
      event._id.toString(),
      admin_id,
      'rejected',
      NotificationType.events,
    );
    
    // Create notification for the user about rejection
    await this.notificationsService.createNotification({
      receiverId: event.host,
      notification_type: NotificationType.events,
      entityId: event._id.toString(),
      message: `Your event "${event.title}" has been rejected: ${message}`,
      data: { eventTitle: event.title, reason: message },
      isRead: false,
      isAdminNotification: false,
    });
    
    return rejectEvent;
  }
}
