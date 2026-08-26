import { Inject, Injectable, Logger } from '@nestjs/common';
import { LeadCandidate, type LeadCandidateDocument } from 'src/shared/schema';
import type { InviteLeadDto } from './dto/invite-lead.dto';
import type { InviteLeadResponse } from './dto/lead-request-responses';
import type { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { SessionService } from './services/sessions.service';

@Injectable()
export class LeadsService {
    private readonly logger = new Logger(LeadsService.name)

    constructor(
        @Inject(LeadCandidate.name)
        private readonly leadCandidateRepo: Model<LeadCandidateDocument>,
        private readonly schoolSessionService: SessionService) {

    }
    async inviteLead(data: InviteLeadDto, adminId: string): Promise<InviteLeadResponse> {
        /**
         1. Validate session
        2. Validate position
        3. Find user by normalized email
        4. Check existing candidate
        5. Check existing assignment
        6. Create candidate
        7. If user exists:
            associate user
            create in-app notification
        else:
            send invitation email
        8. Record invitation event``
         */
        const activeSession = await this.schoolSessionService
        return { user_id: randomUUID(), email_sent: true, user_exists: true, number_of_candidates_for_role: 5 }
    }
}
