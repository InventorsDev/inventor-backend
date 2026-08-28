import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { AuditLogActions, LeadAssignmentPositions, LeadCandidate } from 'src/shared/schema';
import type { InviteLeadDto } from './dto/invite-lead.dto';
import type { InviteLeadResponse } from './dto/lead-request-responses';
import { SessionService } from './services/sessions.service';
import { UsersService } from '../users.service';
import mongoose from 'mongoose';
import { CandidateService } from './services/candidate.service';
import { getMailTemplate, sendMail } from 'src/shared/utils';
import { EmailFromType } from 'src/shared/interfaces';
import { LeadAuditService } from './services/lead-audit.service';

@Injectable()
export class LeadsService {
    private readonly logger = new Logger(LeadsService.name)

    constructor(
        @Inject(LeadCandidate.name)
        private readonly schoolSessionService: SessionService,
        @Inject(forwardRef(() => UsersService))
        private readonly userService: UsersService,
        private readonly candidateService: CandidateService,
        private readonly leadAuditService: LeadAuditService) {
    }
    async inviteLead(data: InviteLeadDto, adminId: string): Promise<InviteLeadResponse> {
        /**
         1. Validate session
        2. Validate position
        3. Find user by normalized email
        4. Check existing candidate
        6. Create candidate
        7. If user exists:
            associate user
            create in-app notification
        else:
            send invitation email
        8. Record invitation event``
         */
        if (!mongoose.isValidObjectId(data.sessionId)) { throw new BadRequestException('corrupt session id') }
        const isSessionActive: boolean = await this.schoolSessionService.isSessionValid(new mongoose.Types.ObjectId(data.sessionId));
        const isPositionValid: boolean = Object.values(LeadAssignmentPositions).includes(data.position);
        //using this check instead of findByEmail because that throws an error if no user is found
        const userExists: boolean = await this.userService.checkUserExists(data.email)
        const isExistingCandidate: boolean = await this.candidateService.isExistingCandidates(data.email, data.sessionId);

        if (!isSessionActive && !isPositionValid && !isExistingCandidate) {
            if (!isSessionActive) this.logger.debug('session not active')
            else if (!isPositionValid) this.logger.debug('invalid role data')
            else if (!isExistingCandidate) this.logger.debug('candidate is already selected for a role')
            throw new BadRequestException('invalid data passed');
        }
        const createdCandidate = await this.candidateService.createCandidate({
            sessionId: data.sessionId,
            email: data.email,
            recommendedBy: adminId,
            recommendedFor: data.position
        })

        const numberOfCandidatesForRole = await this.candidateService.getNoOfCandidatesForRole(data.position, data.sessionId)
        const getSession = await this.schoolSessionService.getSession(data.sessionId)
        if (userExists) {
            const user = await this.userService.findByEmailWithId(data.email);
            //TODO:  send mail/notification to user
            await sendMail({
                to: user.email,
                from: EmailFromType.HELLO,
                subject: 'Congratulations You Have Been Nominated As A Lead',
                template: getMailTemplate().leadNominationExistingUser,
                templateVariables: {
                    user: user.basicInfo.firstName,
                    position: data.position,
                    school: getSession.name,
                    schoolYear: getSession.startsAt.getFullYear().toString(),
                    session: formatLongDate(getSession.startsAt)
                },
            })
            const now = new Date()
            await this.candidateService.updateCandidateInfo(createdCandidate._id.toString(), { userId: user._id.toString(), invitedAt: now })

            this.leadAuditService.createLog({ candidateId: createdCandidate._id.toString(), actorId: adminId, action: AuditLogActions.INVITED, createdAt: now })

            return { user_id: user._id.toString(), user_exists: true, email_sent: false, number_of_candidates_for_role: numberOfCandidatesForRole }
        }

        return { email_sent: true, user_exists: false, number_of_candidates_for_role: numberOfCandidatesForRole }
    }
}
