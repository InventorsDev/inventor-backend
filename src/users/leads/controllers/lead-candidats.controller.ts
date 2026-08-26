import { Body, Controller, Logger, Post } from '@nestjs/common';
import { LeadsService } from '../leads.service';
import { ApiTags } from '@nestjs/swagger';
import { InviteLeadDto } from '../dto/invite-lead.dto';
import type { InviteLeadResponse } from '../dto/lead-request-responses';
import { randomUUID } from 'crypto';


@Controller('admin/lead-candidates')
export class LeadCandidateController {
    private readonly logger = new Logger(LeadCandidateController.name)
    constructor(private readonly leadsService: LeadsService) { }

    @Post()
    inviteLead(@Body() inviteLeadDto: InviteLeadDto): Promise<InviteLeadResponse> {
        const admin_id: string = randomUUID()
        return this.leadsService.inviteLead(inviteLeadDto, admin_id);
    }
}