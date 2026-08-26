import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { AdminLeadsController } from './controllers/admin-leads.controller';
import { DBModule } from 'src/shared/schema';
import { LeadCandidateController } from './controllers/lead-candidats.controller';
import { SessionService } from './services/sessions.service';

@Module({
  imports: [DBModule],
  controllers: [AdminLeadsController, LeadCandidateController],
  providers: [LeadsService, SessionService],
})
export class LeadsModule { }
