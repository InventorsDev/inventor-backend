import { Inject, Injectable, Logger } from "@nestjs/common";
import type { Model } from "mongoose";
import { LeadAuditLog, type AuditLogActions, type LeadAuditLogDocument } from "src/shared/schema";

export interface LeadAuditCreate {
    candidateId: string;
    actorId: string
    action: AuditLogActions.INVITED;
    metadata?: Record<string, string>;
    createdAt: Date
}

@Injectable()
export class LeadAuditService {
    private readonly logger = new Logger(LeadAuditService.name)

    constructor(
        @Inject(LeadAuditLog.name)
        private readonly leadAuditRepo: Model<LeadAuditLogDocument>
    ) { }

    async createLog(data: LeadAuditCreate): Promise<void> {
        const auditLog = await this.leadAuditRepo.create({
            data
        })
        await auditLog.save()
        this.logger.debug('created audit log')
    }
}