import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import mongoose, { type Model } from 'mongoose';
import {
  LeadCandidateStatus,
  LeadInvitation,
  LeadInvitationStatus,
  type LeadAssignmentPositions,
  type LeadCandidate,
  type LeadInvitationDocument,
} from 'src/shared/schema';
import { CandidateService } from './candidate.service';

export interface InviteVerifyTokenResponse {
  email: string;
  valid: boolean;
  invitationId: string;
  position: LeadAssignmentPositions;
  expiresAt: Date;
}

@Injectable()
export class LeadInvitationService {
  private readonly logger = new Logger(LeadInvitationService.name);
  constructor(
    @Inject(LeadInvitation.name)
    private readonly leadInvitationRepo: Model<LeadInvitationDocument>,
    private readonly candidateService: CandidateService,
  ) {}

  async generateInviteToken(candidateId: string): Promise<string> {
    const token = await this.genrateRandomToken();
    try {
      const tokenHash = createHash('sha256').update(token).digest('hex');

      const invitation = await this.leadInvitationRepo.create({
        candidateId: new mongoose.Types.ObjectId(candidateId),
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      await invitation.save();
    } catch (e) {
      this.logger.error('failed to create invite entry, ', e);
      throw new InternalServerErrorException('failed to Invite Lead');
    }
    return token;
  }

  private async genrateRandomToken(): Promise<string> {
    return randomBytes(32).toString('hex');
  }

  async verifyToken(token: string): Promise<InviteVerifyTokenResponse> {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const invitation = await this.leadInvitationRepo
      .findOne({
        where: { tokenHash },
      })
      .populate<{ candidate: LeadCandidate }>('candidate');

    this.logger.debug('fetched data for invitatino: ', invitation);

    if (!invitation) {
      throw new BadRequestException('Invalid invitation');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    if (invitation.status !== LeadInvitationStatus.PENDING) {
      throw new BadRequestException('Invitation is no longer valid');
    }

    return {
      valid: true,
      email: invitation.candidate.email,
      invitationId: invitation._id.toString(),
      position: invitation.candidate.recommendedFor,
      expiresAt: invitation.expiresAt,
    };
  }

  async acceptInvitation(token: string) {
    // verify token
    const verifiedToken = await this.verifyToken(token);
    // update lead invitation status
    await this.leadInvitationRepo.updateOne(
      { _id: verifiedToken.invitationId },
      {
        $set: {
          status: LeadInvitationStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      },
    );
    // update ALL candidate with [userId and position] to pending
    const updatedNominatinos =
      await this.candidateService.updateAllCandidateNominationsForRole(
        verifiedToken.email,
        verifiedToken.position,
        LeadCandidateStatus.PENDING,
      );
    return { updated: updatedNominatinos, position: verifiedToken.position };
  }

  async declineInvitation(token: string) {
    // verify token
    const verifiedToken = await this.verifyToken(token);
    // update lead invitation status
    await this.leadInvitationRepo.updateOne(
      { _id: verifiedToken.invitationId },
      {
        $set: {
          status: LeadInvitationStatus.DECLINED,
          acceptedAt: new Date(),
        },
      },
    );
    // update ALL candidate with [userId and position] to pending
    const updatedNominatinos =
      await this.candidateService.updateAllCandidateNominationsForRole(
        verifiedToken.email,
        verifiedToken.position,
        LeadCandidateStatus.WITHDRAWN,
      );
    return { updated: updatedNominatinos, position: verifiedToken.position };
  }
}
