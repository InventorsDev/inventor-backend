import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { Model } from 'mongoose';
import mongoose from 'mongoose';
import {
  LeadAssignment,
  LeadAssignmentStatus,
  type LeadAssignmentDocument,
  type LeadAssignmentPositions,
} from 'src/shared/schema';
import type { LeadAssignmentCreateDto } from 'src/users/dto/lead-assignment.dto';

@Injectable()
export class LeadAssignmentService {
  private readonly logger = new Logger(LeadAssignmentService.name);

  constructor(
    @Inject(LeadAssignment.name)
    private readonly leadAssignmentRepo: Model<LeadAssignmentDocument>,
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
