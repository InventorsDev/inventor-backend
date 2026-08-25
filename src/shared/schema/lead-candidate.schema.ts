export enum LeadCandidateStatus {
    INVITED = 'invited',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    WITHDRAWN = 'withdrawn'
}

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import type { HydratedDocument } from "mongoose";

export type LeadCandidateDocument = HydratedDocument<LeadCandidate>;

@Schema({ timestamps: true })
export class LeadCandidate {
    @Prop({ required: false, index: true })
    email: string

    @Prop({ required: false, index: true, type: mongoose.Schema.Types.ObjectId })
    userId: mongoose.Types.ObjectId

    @Prop({ required: true, index: true, type: mongoose.Schema.Types.ObjectId })
    sessionId: mongoose.Types.ObjectId;

    @Prop({ required: true, index: true, default: LeadCandidateStatus.INVITED })
    status: LeadCandidateStatus

    @Prop({ index: true, required: true, type: mongoose.Schema.Types.ObjectId })
    recommendedBy: mongoose.Types.ObjectId

    @Prop({ index: true, required: true })
    recommendedAt: Date

    @Prop({ index: true })
    invitedAt: Date

    @Prop({ index: true })
    acceptedAt: Date

    @Prop({ index: true })
    rejectedAt: Date

    @Prop()
    rejectionReason: string
}

export const LeadCandidateSchema = SchemaFactory.createForClass(LeadCandidate)