import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { LeadCandidate } from 'src/shared/schema';
import { LeadAuditService } from './lead-audit.service';
import { LeadAssignmentService } from './lead-assignment.service';
import { CandidateService } from './candidate.service';
import { SessionService } from './sessions.service';

describe('CandidateService', () => {
  let service: CandidateService;
  const leadCandidateRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateService,
        { provide: LeadCandidate.name, useValue: leadCandidateRepo },
        { provide: 'APP_CONNECTION', useValue: {} },
        { provide: SessionService, useValue: {} },
        { provide: LeadAssignmentService, useValue: {} },
        { provide: LeadAuditService, useValue: {} },
      ],
    }).compile();

    service = module.get<CandidateService>(CandidateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns candidates for the requested session', async () => {
    const sessionId = new Types.ObjectId();
    const candidates = [{ email: 'candidate@example.com' }];
    leadCandidateRepo.find.mockResolvedValue(candidates);

    await expect(service.getAllSessionCandidates(sessionId)).resolves.toEqual(
      candidates,
    );
    expect(leadCandidateRepo.find).toHaveBeenCalledWith({ sessionId });
  });
});
