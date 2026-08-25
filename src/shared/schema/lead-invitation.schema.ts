import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import type { HydratedDocument } from "mongoose";


export type LeadInvitationDocument = HydratedDocument<LeadInvitation>

@Schema({ timestamps: true })
export class LeadInvitation {
    @Prop({ required: true, index: true, type: mongoose.Schema.Types.ObjectId })
    candidateId: mongoose.Types.ObjectId

    @Prop({ required: true })
    tokenHash: string

    @Prop({ required: true, index: true })
    expiresAt: Date;

    @Prop({ required: true })
    acceptedAt: Date
}

export const LeadInvitationSchema = SchemaFactory.createForClass(LeadInvitation)