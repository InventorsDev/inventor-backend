import { Test, TestingModule } from '@nestjs/testing';
import { LeadRegistrationService } from './lead_registration.service';

describe('LeadRegistrationService', () => {
  let service: LeadRegistrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeadRegistrationService],
    }).compile();

    service = module.get<LeadRegistrationService>(LeadRegistrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
