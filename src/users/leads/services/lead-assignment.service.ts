import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Model } from 'mongoose';
import mongoose from 'mongoose';
import {
  AuditLogActions,
  LeadAssignment,
  LeadAssignmentStatus,
  type LeadAssignmentDocument,
  type LeadAssignmentPositions,
} from 'src/shared/schema';
import type { LeadAssignmentCreateDto } from 'src/users/dto/lead-assignment.dto';
import type { LeadRevokeReasonDto } from 'src/users/dto/lead-revoke-status.dto';
import { LeadAuditService } from './lead-audit.service';

@Injectable()
export class LeadAssignmentService {
  private readonly logger = new Logger(LeadAssignmentService.name);

  constructor(
    @Inject(LeadAssignment.name)
    private readonly leadAssignmentRepo: Model<LeadAssignmentDocument>,
    private readonly leadAuditService: LeadAuditService,
  ) {}

  async createAssignment(
    data: LeadAssignmentCreateDto,
  ): Promise<LeadAssignmentDocument> {
    for (const value of Object.values(data)) {
      if (!value) {
        throw new BadRequestException('Bad Request Data');
      }
    }
    return await this.leadAssignmentRepo.create({
      ...data,
      appointedAt: new Date(),
      status: LeadAssignmentStatus.ACTIVE,
      startsAt: new Date(),
    });
  }

  async getAllLeads(
    session_id: string = '',
  ): Promise<LeadAssignmentDocument[]> {
    if (session_id === '' || !session_id) {
      return await this.leadAssignmentRepo.find({
        status: LeadAssignmentStatus.ACTIVE,
      });
    }
    const sessionId = new mongoose.Types.ObjectId(session_id);
    // vlaidate session id
    if (!mongoose.isValidObjectId(sessionId))
      throw new BadRequestException('invalid session id');
    const leads = await this.leadAssignmentRepo.find({ sessionId });
    return leads;
  }

  async getLead(id: string): Promise<LeadAssignmentDocument> {
    const assignmentId = new mongoose.Types.ObjectId(id);
    return await this.leadAssignmentRepo.findOne({ _id: assignmentId });
  }

  async revokeLeadStatus(
    lead_id: string,
    reason: string,
    admin_id: string,
  ): Promise<boolean> {
    // check if lead is avlid
    if (!reason || reason === '')
      throw new BadRequestException('reason not found');
    const leadId = new mongoose.Types.ObjectId(lead_id);
    if (!mongoose.isValidObjectId(leadId))
      throw new BadRequestException('invalid id');
    try {
      const lead = await this.leadAssignmentRepo.findOne({ _id: leadId });
      if (!lead) throw new NotFoundException('lead not found');
      // change status
      lead.status = LeadAssignmentStatus.REVOKED;
      lead.endedReason = reason;
      await lead.save();
      // create audit log
      this.leadAuditService.createLog({
        candidateId: lead._id.toString(),
        actorId: admin_id,
        createdAt: new Date(),
        action: AuditLogActions.REVOKED,
        metadata: { rejectionReason: reason },
      });

      return true;
    } catch (e) {
      this.logger.error('failed to make database transaction: ', e);
    }
  }

  async isRoleFree(
    role: LeadAssignmentPositions,
    sessionId: mongoose.Types.ObjectId,
  ): Promise<boolean> {
    const assignment = await this.leadAssignmentRepo.findOne({
      postion: role,
      sessionId,
    });
    if (assignment) {
      return false;
    }
    return true;
  }
}
