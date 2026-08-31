import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Model } from 'mongoose';
import {
  LeadAssignmentPositions,
  LeadCandidate,
  LeadCandidateStatus,
  type LeadCandidateDocument,
} from 'src/shared/schema';
import mongoose from 'mongoose';
import { NotFoundError } from 'rxjs';

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
