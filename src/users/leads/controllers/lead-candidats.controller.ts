import {
  Body,
  Controller,
  Logger,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { LeadsService } from '../leads.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InviteLeadDto } from '../dto/invite-lead.dto';
import type { InviteLeadResponse } from '../dto/lead-request-responses';
import { randomUUID } from 'crypto';
import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import type { ApiReq } from 'src/shared/interfaces';

@Controller('admin/lead-candidates')
export class LeadCandidateController {
  private readonly logger = new Logger(LeadCandidateController.name);
  constructor(private readonly leadsService: LeadsService) {}

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
}
