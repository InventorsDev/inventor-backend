import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument } from "mongoose";
import mongoose from "mongoose";

export enum LeadAssignmentPositions {
    BACKEND = 'backend',
    FRONTEND = 'frontend',
    PRODUCT_DESIGNER = 'product designer',
    AI_ML = 'ai/ml'
}

export enum LeadAssignmentStatus {
    ACTIVE = 'active',
    EXPIRED = 'expired',
    REVOKED = 'revoked'
}

export type LeadAssignmentDocument = HydratedDocument<LeadAssignment>

@Schema({ timestamps: true })
export class LeadAssignment {
    @Prop({ type: mongoose.Schema.Types.ObjectId, index: true })
    userId: mongoose.Types.ObjectId;

    @Prop({ required: true, index: true, type: mongoose.Schema.Types.ObjectId })
    sessionId: mongoose.Types.ObjectId;

    @Prop({ required: true })
    postion: LeadAssignmentPositions;

    @Prop({ required: true })
    status: LeadAssignmentStatus;

    @Prop({ required: true, index: true, type: mongoose.Schema.Types.ObjectId })
    appointedBy: mongoose.Types.ObjectId;

    @Prop({ required: true, index: true })
    appointedAt: Date

    @Prop({ required: true, index: true })
    startsAt: Date

    @Prop({ required: true, index: true })
    endsAt: Date

    @Prop({ index: true })
    endedAt: Date

    @Prop({})
    endedReason: string
}

export const LeadAssignmentSchema = SchemaFactory.createForClass(LeadAssignment)