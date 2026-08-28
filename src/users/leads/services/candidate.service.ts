import { BadRequestException, Inject, Injectable, Logger } from "@nestjs/common";
import type { UUID } from "crypto";
import type { Model } from "mongoose";
import { LeadAssignmentPositions, LeadCandidate, LeadCandidateStatus, type LeadCandidateDocument } from "src/shared/schema";
import type { SessionService } from "./sessions.service";
import mongoose from "mongoose";

export interface CreateCandidate {
    email: string;
    sessionId: string;
    recommendedBy: string;
    recommendedFor: string;
}

@Injectable()
export class CandidateService {
    private readonly logger = new Logger(CandidateService.name)

    constructor(
        @Inject(LeadCandidate.name)
        private readonly leadCandidateRepo: Model<LeadCandidateDocument>,
    ) { }

    async getAllSessionCandidates(
        sessionId: mongoose.Types.ObjectId
    ): Promise<LeadCandidateDocument[]> {
        return await this.leadCandidateRepo.find({ sessionId })
    }

    async getNoOfCandidatesForRole(role: string, sessId: string): Promise<number> {
        if (!Object.values(LeadAssignmentPositions).includes(role as LeadAssignmentPositions)) throw new BadRequestException('invalid role')
        const sessionId = new mongoose.Types.ObjectId(sessId);
        const candidates = await this.getAllSessionCandidates(sessionId)
        const candidatesOfRole = candidates.filter((candidate) => candidate.recommendedFor === role)
        return candidatesOfRole.length
    }

    async isExistingCandidates(email: string, sessId: string): Promise<boolean> {
        const sessionId = new mongoose.Types.ObjectId(sessId)
        const activeSessionCandidates = await this.getAllSessionCandidates(sessionId);
        for (const candidate of activeSessionCandidates) {
            if (email === candidate.email) {
                return true;
            }
        }
        return false;
    }

    async createCandidate(data: CreateCandidate): Promise<LeadCandidateDocument> {
        const currentDate = Date.now()
        const candidate = await this.leadCandidateRepo.create({ ...data, recommendedAt: currentDate, status: LeadCandidateStatus.INVITED })
        return candidate.save();
    }

    async updateCandidateInfo(id: string, data: Record<string, any>): Promise<LeadCandidateDocument> {
        const candidateId = new mongoose.Types.ObjectId(id)
        const update = (await this.leadCandidateRepo.findByIdAndUpdate(candidateId, data))
        return await update.save()
    }
}