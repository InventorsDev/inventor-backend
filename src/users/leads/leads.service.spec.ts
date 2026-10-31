import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { CandidateService } from './services/candidate.service';
import { LeadAuditService } from './services/lead-audit.service';
import { LeadInvitationService } from './services/lead-invitation.service';
import { SessionService } from './services/sessions.service';
import { LeadsService } from './leads.service';

describe('LeadsService', () => {
  let service: LeadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: SessionService, useValue: {} },
        { provide: UsersService, useValue: {} },
        { provide: ConfigService, useValue: {} },
        { provide: CandidateService, useValue: {} },
        { provide: LeadAuditService, useValue: {} },
        { provide: LeadInvitationService, useValue: {} },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
