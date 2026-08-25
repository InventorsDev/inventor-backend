import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import type { HydratedDocument } from "mongoose";
import { type } from "os";
import { of } from "rxjs";

export type LeadAuditLogDocument = HydratedDocument<LeadAuditLog>
export enum AuditLogActions {
    RECOMMENDED = 'recommended',
    INVITED = 'invited',
    INVITATION_ACCEPTED = 'invitation_accepted',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    ASSIGNED = 'assigned',
    REVOKED = 'revoked',
    EXPIRED = 'expired',
    POSITION_CHANGED = 'position_changed'
}

@Schema()
export class LeadAuditLog {
    @Prop({ required: true, index: true, type: mongoose.Schema.Types.ObjectId })
    candidateId: mongoose.Types.ObjectId

    @Prop({ required: true, index: true, type: mongoose.Schema.Types.ObjectId })
    assignmentId: mongoose.Types.ObjectId

    @Prop({ required: true, index: true, type: mongoose.Schema.Types.ObjectId })
    actorId: mongoose.Types.ObjectId

    @Prop({ required: true })
    action: AuditLogActions;

    @Prop({ type: Map, of: String })
    metadata: Map<string, string>

    @Prop({ required: true })
    createdAt: Date
}

export const LeadAuditLogSchema = SchemaFactory.createForClass(LeadAuditLog)