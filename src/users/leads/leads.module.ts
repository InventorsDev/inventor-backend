import { forwardRef, Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { DBModule } from 'src/shared/schema';
import { LeadCandidateController } from './controllers/lead-candidats.controller';
import { SessionService } from './services/sessions.service';
import { CandidateService } from './services/candidate.service';
import { LeadAuditService } from './services/lead-audit.service';
import { UsersModule } from '../users.module';
import { LeadInvitationService } from './services/lead-invitation.service';
import { SchoolSessionController } from './controllers/school-session.controller';
import { LeadAssignmentService } from './services/lead-assignment.service';
import { LeadAssignmentController } from './controllers/lead-assignment.controller';
import { LeadsController } from './controllers/leads.controller';
import { LeadContributionService } from './services/lead-contirbution.service';
import { SessionAndLeadsCron } from './services/session-and-leads-cron-jobs.service';
import { LeadInvitationController } from './controllers/lead-invitation.controller';

@Module({
  imports: [DBModule, forwardRef(() => UsersModule)],
  controllers: [
    LeadCandidateController,
    SchoolSessionController,
    LeadAssignmentController,
    LeadsController,
    LeadInvitationController,
  ],
  providers: [
    LeadsService,
    SessionService,
    CandidateService,
    LeadAuditService,
    LeadInvitationService,
    LeadAssignmentService,
    LeadContributionService,
    SessionAndLeadsCron,
  ],
})
export class LeadsModule {}
