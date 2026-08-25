import { Test, TestingModule } from '@nestjs/testing';
import { AdminLeadsController } from './admin-leads.controller';
import { LeadsService } from '../leads.service';

describe('LeadsController', () => {
  let adminLeadsController: AdminLeadsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminLeadsController],
      providers: [LeadsService],
    }).compile();

    adminLeadsController = module.get<AdminLeadsController>(AdminLeadsController);
  });

  it('should be defined', () => {
    expect(adminLeadsController).toBeDefined();
  });
});
