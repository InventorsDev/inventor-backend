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
  SchoolNames,
  SchoolSessionStatus,
  type LeadAssignmentDocument,
  type LeadAssignmentPositions,
} from 'src/shared/schema';
import type { LeadAssignmentCreateDto } from 'src/users/dto/lead-assignment.dto';
import type { LeadRevokeReasonDto } from 'src/users/dto/lead-revoke-status.dto';
import { LeadAuditService } from './lead-audit.service';
import { SessionService } from './sessions.service';

@Injectable()
export class LeadAssignmentService {
  private readonly logger = new Logger(LeadAssignmentService.name);

  constructor(
    @Inject(LeadAssignment.name)
    private readonly leadAssignmentRepo: Model<LeadAssignmentDocument>,
    private readonly leadAuditService: LeadAuditService,
    private readonly sessionService: SessionService,
  ) {}

  async createAssignment(
    data: LeadAssignmentCreateDto,
  ): Promise<LeadAssignmentDocument> {
    for (const value of Object.values(data)) {
      if (!value) {
        throw new BadRequestException('Bad Request Data');
      }
    }
    const session = await this.sessionService.getSession(data.sessionId);
    if (!session) throw new BadRequestException('session not found');
    return await this.leadAssignmentRepo.create({
      ...data,
      appointedAt: new Date(),
      status: LeadAssignmentStatus.ACTIVE,
      startsAt: new Date(),
      endsAt: session.endsAt,
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

  async getActiveLeadsForSchool(
    school: SchoolNames,
  ): Promise<LeadAssignmentDocument[]> {
    // validate school name
    const isValidSchool = Object.values(SchoolNames).includes(school);
    if (!isValidSchool)
      throw new BadRequestException('this school is not registered');
    // find active session for school
    const activeSchoolSession =
      await this.sessionService.getActiveSessions(school);
    // find active leads for that session
    return await this.leadAssignmentRepo.find({
      status: LeadAssignmentStatus.ACTIVE,
      sessionId: activeSchoolSession[0]._id,
    });
  }

  async getLeadHistory(school: SchoolNames) {
    const isValidSchool = Object.values(SchoolNames).includes(school);

    if (!isValidSchool) {
      throw new BadRequestException('This school is not registered');
    }

    const sessions = await this.sessionService.getAllSessions();

    const schoolSessions = sessions
      .filter((session) => session.name === school)
      .sort(
        (a, b) =>
          new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
      );

    if (!schoolSessions.length) {
      return [];
    }

    const sessionIds = schoolSessions.map((session) => session._id);

    const leads = await this.leadAssignmentRepo.find({
      sessionId: { $in: sessionIds },
    });

    return schoolSessions.map((session) => ({
      session,
      leads: leads.filter(
        (lead) => lead.sessionId.toString() === session._id.toString(),
      ),
    }));
  }

  async getMyAssignments(
    id: string,
    current: boolean = false,
  ): Promise<LeadAssignment[] | LeadAssignment> {
    const userId = new mongoose.Types.ObjectId(id);
    if (current) return await this.leadAssignmentRepo.findOne({ userId });
    if (!mongoose.isValidObjectId(userId))
      throw new BadRequestException('Invalid user Id');
    return await this.leadAssignmentRepo.find({ userId });
  }
}
