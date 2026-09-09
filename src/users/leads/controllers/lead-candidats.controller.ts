import {
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { LeadsService } from '../leads.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { InviteLeadDto } from '../dto/invite-lead.dto';
import type { InviteLeadResponse } from '../dto/lead-request-responses';
import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import type { ApiReq } from 'src/shared/interfaces';
import { CandidateService } from '../services/candidate.service';
import mongoose from 'mongoose';
import type { CandidateResponse } from 'src/users/dto/lead-candidate-response';
import type { LeadCandidate } from 'src/shared/schema';
import type { LeadRejectionDTO } from 'src/users/dto/lead-rejection.dto';

@Controller('admin/lead-candidates')
export class LeadCandidateController {
  private readonly logger = new Logger(LeadCandidateController.name);
  constructor(
    private readonly leadsService: LeadsService,
    private readonly candidateService: CandidateService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Post()
  inviteLead(
    @Request() req: ApiReq,
    @Body() inviteLeadDto: InviteLeadDto,
  ): Promise<InviteLeadResponse> {
    this.logger.debug(`role: ${req.user}`);
    const admin_id: string = req.user._id.toString();
    this.logger.debug(`id: ${admin_id}`);
    return this.leadsService.inviteLead(inviteLeadDto, admin_id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Get()
  async getAllCandidates(
    @Query('sessionId') sessionId: string,
  ): Promise<CandidateResponse[]> {
    const mongooseSessionId = new mongoose.Types.ObjectId(sessionId);
    const candidates =
      await this.candidateService.getAllSessionCandidates(mongooseSessionId);
    return candidates.map(
      (candidate): CandidateResponse => ({
        id: candidate._id.toString(),
        email: candidate.email,
        userId: candidate.userId?.toString(),
        status: candidate.status,
        recommendedFor: candidate.recommendedFor,
      }),
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Post(':id/approve')
  async acceptCandidateAsLead(@Param('id') id: string, @Req() req: ApiReq) {
    const adminId = req.user._id.toString();
    return this.candidateService.approveCandidate(id, adminId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Post(':id/reject')
  async rejectCandidateAsLead(
    @Param('id') id: string,
    @Body() reason: LeadRejectionDTO,
    @Req() req: ApiReq,
  ) {
    const adminId = req.user._id.toString();
    return this.candidateService.rejectCandidate(id, adminId, reason.reason);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Get(':id')
  async getCandidate(@Param('id') id: string): Promise<LeadCandidate> {
    const candidate = await this.candidateService.getCandidate(id);
    if (!candidate) throw new NotFoundException('candidate not found');
    return candidate;
  }
}
