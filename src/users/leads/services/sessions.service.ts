import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import mongoose from 'mongoose';
import type { Model } from 'mongoose';
import {
  SchoolNames,
  SchoolSession,
  SchoolSessionStatus,
  type SchoolSessionDocumet,
} from 'src/shared/schema';
import type { CreateSchoolSessionDto } from '../dto/create-session.dto';
import e from 'express';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  constructor(
    @Inject(SchoolSession.name)
    private readonly schoolSessionRepo: Model<SchoolSessionDocumet>,
  ) {}

  async isSessionValid(
    sessionId: mongoose.Types.ObjectId,
    schoolName?: string,
  ): Promise<boolean> {
    const currentSession = await this.schoolSessionRepo.findById(sessionId);
    if (!currentSession) throw new NotFoundException('Invalid Session Id');
    else if (currentSession.status !== SchoolSessionStatus.ACTIVE)
      throw new BadRequestException('session is not active');
    const activeSession = await this.getActiveSessions(
      schoolName ? schoolName : null,
    );
    const oneMonth = new Date().setMonth(new Date().getMonth() + 1);
    for (const session of activeSession) {
      if (
        session.name === currentSession.name &&
        currentSession.endsAt.getTime() > oneMonth
      ) {
        return true;
      }
    }
    return false;
  }

  async getActiveSessions(
    schoolName?: string,
  ): Promise<SchoolSessionDocumet[]> {
    if (schoolName) {
      const normalizedSchool = Object.entries(SchoolNames).find(
        ([key, value]) =>
          key.toLowerCase() === schoolName.toLowerCase() ||
          value.toLowerCase() === schoolName.toLowerCase(),
      )?.[1];

      if (!normalizedSchool) {
        throw new BadRequestException('Invalid school name');
      }

      return await this.schoolSessionRepo.find({
        status: SchoolSessionStatus.ACTIVE,
        name: normalizedSchool,
      });
    } else {
      return await this.schoolSessionRepo.find({
        status: SchoolSessionStatus.ACTIVE,
      });
    }
  }

  async getAllSessions(): Promise<SchoolSessionDocumet[]> {
    return await this.schoolSessionRepo.find();
  }

  async getSession(sessId: string): Promise<SchoolSession> {
    const sessionId = new mongoose.Types.ObjectId(sessId);
    return await this.schoolSessionRepo.findById(sessionId);
  }

  isSessionActive(startsAt: Date | string, endsAt: Date | string): boolean {
    const now = new Date().getTime();
    const start = new Date(startsAt).getTime();
    const end = new Date(endsAt).getTime();

    let status: 'Pending' | 'Active' | 'Ended';
    if (now < start) {
      status = 'Pending';
    } else if (now > end) {
      status = 'Ended';
    } else {
      status = 'Active';
    }

    this.logger.debug(`Session status: ${status}`);

    return status === 'Active';
  }

  async createSession(
    sessionData: CreateSchoolSessionDto,
  ): Promise<SchoolSessionDocumet> {
    // validate data
    this.logger.debug(`sessioninfo: ${JSON.stringify(sessionData)}`);
    if (!sessionData.name || !sessionData.startsAt || !sessionData.endsAt)
      throw new BadRequestException('Bad session information');
    // check for existing session
    const exisitngSession = await this.schoolSessionRepo.findOne({
      name: sessionData.name,
      startsAt: sessionData.startsAt,
      endsAt: sessionData.endsAt,
    });
    if (exisitngSession) {
      this.logger.debug('found exisiting session ->');
      return exisitngSession;
    }
    // calculate if session is active
    const sessionStatus = this.isSessionActive(
      sessionData.startsAt,
      sessionData.endsAt,
    )
      ? SchoolSessionStatus.ACTIVE
      : SchoolSessionStatus.ENDED;
    try {
      // create and save session
      const createdSession = await this.schoolSessionRepo.create({
        ...sessionData,
        status: sessionStatus,
      });
      // return session data
      return createdSession.save();
    } catch (e) {
      this.logger.error('failed to create/save session: ', e);
      throw new InternalServerErrorException('failed to create session');
    }
  }
}
