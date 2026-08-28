import { forwardRef, Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { AdminLeadsController } from './controllers/admin-leads.controller';
import { DBModule } from 'src/shared/schema';
import { LeadCandidateController } from './controllers/lead-candidats.controller';
import { SessionService } from './services/sessions.service';
import { CandidateService } from './services/candidate.service';
import { LeadAuditService } from './services/lead-audit.service';
import { UsersModule } from '../users.module';

@Module({
  imports: [DBModule, forwardRef(() => UsersModule)],
  controllers: [AdminLeadsController, LeadCandidateController],
  providers: [LeadsService, SessionService, CandidateService, LeadAuditService],
})
export class LeadsModule { }
