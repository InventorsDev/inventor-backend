import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import type { HydratedDocument } from "mongoose";
import { LeadCandidate } from "./lead-candidate.schema";


export type LeadInvitationDocument = HydratedDocument<LeadInvitation>
export enum LeadInvitationStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    DECLINED = 'declined',
    EXPIRED = 'expired'
}
@Schema({ timestamps: true })
export class LeadInvitation {
    @Prop({ required: true, index: true, type: mongoose.Schema.Types.ObjectId, ref: LeadCandidate.name })
    candidate: mongoose.Types.ObjectId | LeadCandidate

    @Prop({ required: true })
    tokenHash: string

    @Prop({ required: true, index: true })
    expiresAt: Date;

    @Prop({ index: true, default: LeadInvitationStatus.PENDING })
    status: LeadInvitationStatus

    @Prop()
    acceptedAt?: Date

    @Prop()
    declinedAt?: Date

    @Prop()
    declineReason?: string;

    @Prop({ default: false })
    mailSent: boolean;
}

export const LeadInvitationSchema = SchemaFactory.createForClass(LeadInvitation)