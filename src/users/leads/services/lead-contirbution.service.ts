import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { Model } from 'mongoose';
import mongoose, { mongo } from 'mongoose';
import { user } from 'node_modules/@getbrevo/brevo/dist/cjs/api';
import {
  LeadContribution,
  type LeadContributionDocument,
} from 'src/shared/schema';
import type { CreateLeadContributionDto } from 'src/users/dto/create-contribution.dto';

@Injectable()
export class LeadContributionService {
  private readonly logger = new Logger(LeadContributionService.name);

  constructor(
    @Inject(LeadContribution.name)
    private readonly leadContributionRepo: Model<LeadContributionDocument>,
  ) {}

  async getUserContributions(id: string): Promise<LeadContribution[]> {
    const userId = new mongoose.Types.ObjectId(id);
    if (!mongoose.isValidObjectId(userId))
      throw new BadRequestException('invalid user id');
    return await this.leadContributionRepo.find({ userId });
  }

  async createUserContribution(
    data: CreateLeadContributionDto,
    admin_id: string,
  ): Promise<LeadContribution> {
    // verify if user exits
    const userId = new mongoose.Types.ObjectId(data.userId);
    const adminId = new mongoose.Types.ObjectId(admin_id);
    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(adminId))
      throw new BadRequestException('invalid userID');
    const contribution = await this.leadContributionRepo.create({
      ...data,
      addedBy: adminId,
    });
    contribution.save();
    return contribution;
  }
}
