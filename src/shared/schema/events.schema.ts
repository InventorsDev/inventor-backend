import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Location, JoinMethod , SocialsLinks, SocialsLinksRawSchema} from '../interfaces/event.type'
import { IsArray, IsString } from 'class-validator';

export type EventDocument = HydratedDocument<Event>;

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true, index: true })
  title: string;

  @Prop({ required: true,index: true })
  shortDesc: string;

  @Prop({ required: true, index: true})
  description: string;

  @Prop({ required: true })
  host: string;

  @Prop({ index: true })
  @IsArray()
  @IsString({ each: true })
  coHost: string[];

  @Prop({ index: true,
     default: Location.ONLINE,
   })
  location: string;

  @Prop()
  photo: string;

  @Prop({
    index: true,
  })
  joinMethod: JoinMethod;

  @Prop({
    index: true,
  })
  link: string;

  @Prop(raw(SocialsLinksRawSchema))
  socialsLinks: SocialsLinks;

  @Prop({ type: Date })
  eventDate: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);