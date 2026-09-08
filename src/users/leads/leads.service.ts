import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AuditLogActions, LeadAssignmentPositions } from 'src/shared/schema';
import type { InviteLeadDto } from './dto/invite-lead.dto';
import type { InviteLeadResponse } from './dto/lead-request-responses';
import { SessionService } from './services/sessions.service';
import { UsersService } from '../users.service';
import mongoose from 'mongoose';
import { CandidateService } from './services/candidate.service';
import { getMailTemplate, sendMail } from 'src/shared/utils';
import { EmailFromType } from 'src/shared/interfaces';
import { LeadAuditService } from './services/lead-audit.service';
import { LeadInvitationService } from './services/lead-invitation.service';
import { ConfigService } from '@nestjs/config';
import { formatLongDate } from 'src/shared/utils/handlebars-helpers';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly schoolSessionService: SessionService,
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
    private readonly candidateService: CandidateService,
    private readonly leadAuditService: LeadAuditService,
    private readonly leadInvitationService: LeadInvitationService,
  ) {}
  async inviteLead(
    data: InviteLeadDto,
    adminId: string,
  ): Promise<InviteLeadResponse> {
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
    if (!mongoose.isValidObjectId(data.sessionId)) {
      throw new BadRequestException('corrupt session id');
    }
    this.logger.debug('1. Validated ID');
    const sessionId = new mongoose.Types.ObjectId(data.sessionId);
    const isSessionActive =
      await this.schoolSessionService.isSessionValid(sessionId);
    this.logger.debug('2. Validated Session');
    const isPositionValid: boolean = Object.values(
      LeadAssignmentPositions,
    ).includes(data.position);
    this.logger.debug('3. Validated Role');
    //using this check instead of findByEmail because that throws an error if no user is found
    const userExists: boolean = await this.userService.checkUserExists(
      data.email,
    );
    const isExistingCandidate: boolean =
      await this.candidateService.isExistingCandidates(
        data.email,
        data.sessionId,
      );
    this.logger.debug('4. Searched for existing User');

    if (!isSessionActive || !isPositionValid || isExistingCandidate) {
      throw new BadRequestException('invalid data passed');
    }
    this.logger.debug('5. Creating candidate');
    const createdCandidate = await this.candidateService.createCandidate({
      sessionId: data.sessionId,
      email: data.email,
      recommendedBy: adminId,
      recommendedFor: data.position,
    });

    this.logger.debug('6. Created Candidate');

    const numberOfCandidatesForRole =
      await this.candidateService.getNoOfCandidatesForRole(
        data.position,
        data.sessionId,
      );
    const getSession = await this.schoolSessionService.getSession(
      data.sessionId,
    );
    const schoolYear = getSession.startsAt.getFullYear().toString();
    const sessionString = formatLongDate(getSession.startsAt);
    this.logger.debug('7. Created Candidate inviatation details');
    let userId: string;
    let mailSent: boolean = false;
    if (userExists) {
      const user = await this.userService.findByEmailWithId(data.email);
      userId = user._id.toString();
      this.logger.debug('8. Sending mail to exisiting user');
      //TODO:  send mail/notification to user
      try {
        await sendMail({
          to: user.email,
          from: EmailFromType.HELLO,
          subject: 'Congratulations You Have Been Nominated As A Lead',
          template: getMailTemplate().leadNominationExistingUser,
          templateVariables: {
            user: user.basicInfo.firstName,
            position: data.position,
            school: getSession.name,
            schoolYear,
            sessionString,
          },
        });
        mailSent = true;
      } catch (e) {
        this.logger.error(`failed to send mail: `, e);
        mailSent = false;
      }
    } else {
      // invite user
      const token = await this.leadInvitationService.generateInviteToken(
        createdCandidate._id.toString(),
      );

      const registrationLink: string = `${this.configService.get<string>('BASE_URL')}/lead-invitations/${token}/accept`;
      const declineLink: string = `${this.configService.get<string>('BASE_URL')}/lead-invitations/${token}/decline`;
      const inviteMailVariables: Record<string, string> = {
        subject: `Interested in Becoming a Lead? TheInventors_${getSession.name.toUpperCase()}`,
        position: data.position,
        school: getSession.name,
        sessionYear: schoolYear,
        sessionString,
      };
      this.logger.debug('mail metadata: ', inviteMailVariables);
      this.logger.debug('8. Sending mail to new user');
      const { message, id } = await this.userService.inviteLead(data.email, {
        ...inviteMailVariables,
        registrationLink,
        declineLink,
      });
      userId = id;
      mailSent = true;
    }
    this.logger.debug('... mail sent');

    const now = new Date();
    await this.candidateService.updateCandidateInfo(
      createdCandidate._id.toString(),
      { userId, invitedAt: now },
    );
    this.logger.debug('9. Updating candidate Info');

    this.leadAuditService.createLog({
      candidateId: createdCandidate._id.toString(),
      actorId: adminId,
      action: AuditLogActions.INVITED,
      createdAt: now,
    });

    this.logger.debug('10. created entry log');

    return {
      userId,
      user_exists: userExists,
      email_sent: mailSent,
      number_of_candidates_for_role: numberOfCandidatesForRole,
    };
  }
}
