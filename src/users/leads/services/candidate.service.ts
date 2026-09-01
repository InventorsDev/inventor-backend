import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Connection, type Model } from 'mongoose';
import {
  AuditLogActions,
  LeadAssignmentPositions,
  LeadCandidate,
  LeadCandidateRejectionReason,
  LeadCandidateStatus,
  type LeadCandidateDocument,
} from 'src/shared/schema';
import mongoose from 'mongoose';
import { SessionService } from './sessions.service';
import { LeadAssignmentService } from './lead-assignment.service';
import type { LeadAssignmentCreateDto } from 'src/users/dto/lead-assignment.dto';
import { LeadAuditService } from './lead-audit.service';

export interface CreateCandidate {
  email: string;
  sessionId: string;
  recommendedBy: string;
  recommendedFor: string;
}

@Injectable()
export class CandidateService {
  private readonly logger = new Logger(CandidateService.name);

  constructor(
    @Inject(LeadCandidate.name)
    private readonly leadCandidateRepo: Model<LeadCandidateDocument>,
    @Inject('APP_CONNECTION')
    private readonly connection: Connection,
    private readonly sessionService: SessionService,
    private readonly leadAssignmentService: LeadAssignmentService,
    private readonly leadAuditService: LeadAuditService,
  ) {}

  async getAllSessionCandidates(
    sessionId: mongoose.Types.ObjectId,
  ): Promise<LeadCandidateDocument[]> {
    return await this.leadCandidateRepo.find({ sessionId });
  }

  async getNoOfCandidatesForRole(
    role: string,
    sessId: string,
  ): Promise<number> {
    if (
      !Object.values(LeadAssignmentPositions).includes(
        role as LeadAssignmentPositions,
      )
    ) {
      throw new BadRequestException('invalid role');
    }

    const sessionId = new mongoose.Types.ObjectId(sessId);
    const candidates = await this.getAllSessionCandidates(sessionId);

    // Filter by role and collect unique user identifiers (e.g., email or userId)
    const uniqueUsers = new Set(
      candidates
        .filter((candidate) => candidate.recommendedFor === role)
        .map((candidate) => candidate.email),
    );

    return uniqueUsers.size;
  }

  async getCandidate(id: string): Promise<LeadCandidateDocument | null> {
    const candidateId = new mongoose.Types.ObjectId(id);
    if (!mongoose.isValidObjectId(candidateId))
      throw new BadRequestException('invalid id');
    const candidate = await this.leadCandidateRepo.findOne({
      _id: candidateId,
    });
    return candidate;
  }

  async isExistingCandidates(email: string, sessId: string): Promise<boolean> {
    const sessionId = new mongoose.Types.ObjectId(sessId);
    const activeSessionCandidates =
      await this.getAllSessionCandidates(sessionId);
    for (const candidate of activeSessionCandidates) {
      if (email === candidate.email) {
        return true;
      }
    }
    return false;
  }

  async createCandidate(data: CreateCandidate): Promise<LeadCandidateDocument> {
    const currentDate = Date.now();
    const candidate = await this.leadCandidateRepo.create({
      ...data,
      recommendedAt: currentDate,
      status: LeadCandidateStatus.INVITED,
    });
    return candidate.save();
  }

  async approveCandidate(id: string, admin_id: string) {
    const candidateId = new mongoose.Types.ObjectId(id);
    const adminId = new mongoose.Types.ObjectId(admin_id);
    if (
      !mongoose.isValidObjectId(candidateId) ||
      !mongoose.isValidObjectId(adminId)
    ) {
      throw new BadRequestException('invalid id sent');
    }
    const session = await this.connection.startSession();
    try {
      // find candidate
      const candidate = await this.getCandidate(id);
      if (!candidate) throw new NotFoundException('candidate not found');
      if (
        candidate.status !== LeadCandidateStatus.PENDING &&
        candidate.status !== LeadCandidateStatus.INVITED
      ) {
        throw new ConflictException(
          'candidate cannot be approved from this status',
        );
      }
      // validate session
      const isValidSessio = await this.sessionService.isSessionValid(
        candidate.sessionId,
      );
      if (!isValidSessio)
        throw new BadRequestException('Session is not active');
      // check if position is occupied
      const isPositionEmpty = await this.leadAssignmentService.isRoleFree(
        candidate.recommendedFor,
        candidate.sessionId,
      );
      if (!isPositionEmpty)
        throw new ConflictException(
          'A lead has already been assigned to this role',
        );

      // get session end date
      const sessionData = await this.sessionService.getSession(
        candidate.sessionId.toString(),
      );
      // create lead assignment
      const createLeadData: LeadAssignmentCreateDto = {
        userId: candidate.userId.toString(),
        sessionId: candidate.sessionId.toString(),
        position: candidate.recommendedFor,
        appointedBy: adminId.toString(),
        endsAt: sessionData.endsAt,
      };

      const createdlead =
        await this.leadAssignmentService.createAssignment(createLeadData);

      // mark candidate as approved
      const updatedCandidate = await this.leadCandidateRepo.findOneAndUpdate(
        {
          _id: candidate._id,
          status: {
            $in: [LeadCandidateStatus.PENDING, LeadCandidateStatus.INVITED],
          },
        },
        {
          $set: {
            status: LeadCandidateStatus.ASSIGNED,
          },
        },
        {
          new: true,
          session,
        },
      );

      if (!updatedCandidate) {
        throw new ConflictException('Candidate can no longer be approved');
      }

      // mark all other candidates as rejected
      const result = await this.leadCandidateRepo.updateMany(
        {
          sessionId: candidate.sessionId,
          recommendedFor: candidate.recommendedFor,
          _id: { $ne: candidate._id },
          status: {
            $in: [LeadCandidateStatus.PENDING, LeadCandidateStatus.INVITED],
          },
        },
        {
          $set: {
            status: LeadCandidateStatus.REJECTED,
            rejectionReasonCode: LeadCandidateRejectionReason.CANDIDATE_CHOSEN,
            rejectionReason: 'A candidate was chosen for this position',
          },
        },
        {
          session,
        },
      );

      this.logger.log(
        `[APPROVE] Rejected competing candidates | ` +
          `matched=${result.matchedCount} | ` +
          `modified=${result.modifiedCount}`,
      );
      // log audit
      this.leadAuditService.createLog({
        candidateId: candidateId.toString(),
        actorId: adminId.toString(),
        createdAt: new Date(),
        action: AuditLogActions.ASSIGNED,
      });
    } catch (e) {
      this.logger.error('failed to perform transaction', e);
      throw new InternalServerErrorException(
        `Failed to perform transactio: ${e}`,
      );
    } finally {
      session.endSession();
    }
    return true;
  }

  async rejectCandidate(id: string, admin_id: string, rejectionReason: string) {
    const candidateId = new mongoose.Types.ObjectId(id);
    const adminId = new mongoose.Types.ObjectId(admin_id);
    if (
      !mongoose.isValidObjectId(candidateId) ||
      !mongoose.isValidObjectId(adminId)
    ) {
      throw new BadRequestException('invalid id sent');
    }
    const session = await this.connection.startSession();
    // find candidate
    const candidate = await this.getCandidate(id);
    if (!candidate) throw new NotFoundException('candidate not found');
    if (
      candidate.status !== LeadCandidateStatus.PENDING &&
      candidate.status !== LeadCandidateStatus.INVITED
    ) {
      throw new ConflictException(
        'candidate cannot be approved from this status',
      );
    }
    // validate session
    const isValidSessio = await this.sessionService.isSessionValid(
      candidate.sessionId,
    );
    if (!isValidSessio) throw new BadRequestException('Session is not active');

    // mark candidate as rejected
    const updatedCandidate = await this.leadCandidateRepo.findOneAndUpdate(
      {
        _id: candidate._id,
        status: {
          $in: [LeadCandidateStatus.PENDING, LeadCandidateStatus.INVITED],
        },
      },
      {
        $set: {
          status: LeadCandidateStatus.REJECTED,
          rejectionReason,
        },
      },
      {
        new: true,
        session,
      },
    );
    this.leadAuditService.createLog({
      candidateId: candidateId.toString(),
      actorId: adminId.toString(),
      createdAt: new Date(),
      action: AuditLogActions.REJECTED,
      metadata: { rejectionReason },
    });
  }

  async updateCandidateInfo(
    id: string,
    data: Record<string, any>,
  ): Promise<LeadCandidateDocument> {
    const candidateId = new mongoose.Types.ObjectId(id);
    const update = await this.leadCandidateRepo.findByIdAndUpdate(
      candidateId,
      data,
    );
    return await update.save();
  }

  async getAllCandidateNominationForRole(
    email: string,
    role: LeadAssignmentPositions,
  ): Promise<LeadCandidateDocument[] | []> {
    return await this.leadCandidateRepo.find({ email, recommendedFor: role });
  }

  async updateAllCandidateNominationsForRole(
    email: string,
    role: LeadAssignmentPositions,
    status: LeadCandidateStatus,
  ): Promise<boolean> {
    try {
      const result = await this.leadCandidateRepo.updateMany(
        { email, recommendedFor: role },
        { $set: { status } },
      );
      return result.modifiedCount > 0;
    } catch (e) {
      throw new InternalServerErrorException('Unable to update data');
    }
  }
}
