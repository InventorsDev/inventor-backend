import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import {
  Location,
  JoinMethod,
  SocialsLinks,
  Status,
  SocialsLinksRawSchema,
} from '../interfaces/event.type';

export type EventDocument = HydratedDocument<Event>;

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true, index: true })
  title: string;

  @Prop({ required: true })
  shortDesc: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  host: string;

  @Prop({ type: [String], default: [] })
  coHost: string[];

  @Prop({ enum: Location, default: Location.ONLINE })
  location: Location;

  @Prop()
  photo: string;

  @Prop({ enum: JoinMethod })
  joinMethod: JoinMethod;

  @Prop()
  link: string;

  @Prop(raw(SocialsLinksRawSchema))
  socialsLinks: SocialsLinks;

  @Prop({ type: Date, index: true })
  eventDate: Date;

  @Prop({ enum: Status, default: Status.PENDING, index: true })
  status: Status;

  // creator of the event (used for ownership checks on update/delete)
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true })
  createdBy: mongoose.Types.ObjectId;
}

export const EventSchema = SchemaFactory.createForClass(Event);
