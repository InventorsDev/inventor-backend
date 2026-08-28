import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { UUID } from "crypto";
import mongoose from "mongoose";
import type { Model } from "mongoose";
import { async } from "rxjs";
import { SchoolSession, SchoolSessionStatus, type SchoolSessionDocumet } from "src/shared/schema";

@Injectable()
export class SessionService {
    private readonly logger = new Logger(SessionService.name)
    constructor(
        @Inject(SchoolSession.name)
        private readonly schoolSessionRepo: Model<SchoolSessionDocumet>
    ) { }

    async isSessionValid(sessionId: mongoose.Types.ObjectId, schoolName?: string): Promise<boolean> {
        const currentSession = await this.schoolSessionRepo.findById(sessionId);
        if (!currentSession) throw new NotFoundException('Invalid Session Id')
        else if (currentSession.status !== SchoolSessionStatus.ACTIVE) throw new BadRequestException('session is not active');
        const activeSession = await this.getActiveSessions(schoolName ? schoolName : null)
        const oneMonth = new Date().setMonth(new Date().getMonth() + 1)
        for (const session of activeSession) {
            if (session.name === currentSession.name && currentSession.endsAt.getTime() > oneMonth) {
                return true
            }
        }
        return false
    }

    async getActiveSessions(schoolName?: string): Promise<SchoolSession[]> {
        if (schoolName) {
            return await this.schoolSessionRepo.find({ status: SchoolSessionStatus.ACTIVE, name: schoolName })
        } else { return await this.schoolSessionRepo.find({ status: SchoolSessionStatus.ACTIVE }) }
    }

    async getSession(sessId: string): Promise<SchoolSession> {
        const sessionId = new mongoose.Types.ObjectId(sessId);
        return await this.schoolSessionRepo.findById(sessionId);
    }
}