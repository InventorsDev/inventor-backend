import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument } from "mongoose";

export type SchoolSessionDocumet = HydratedDocument<SchoolSession>

export enum SchoolNames {
    OSUSTECH = 'olusegun agagu university of science and technology',
    OAUSTECH = 'olusegun agagu university of science and technology',
    BELLS = 'bells university ogun state'
}

export enum SchoolSessionStatus {
    ACTIVE = 'active',
    ENDED = 'ended'
}

@Schema()
export class SchoolSession {
    @Prop({ required: true, index: true })// name can be school name
    name: SchoolNames

    @Prop({ required: true, index: true })
    startsAt: Date

    @Prop({ required: true, index: true })
    endsAt: Date

    @Prop({ required: true, index: true })
    status: SchoolSessionStatus;
}

export const SchoolSessionSchema = SchemaFactory.createForClass(SchoolSession)