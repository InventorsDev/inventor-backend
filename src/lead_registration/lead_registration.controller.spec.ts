import { Test, TestingModule } from '@nestjs/testing';
import { LeadRegistrationController } from './lead_registration.controller';

describe('LeadRegistrationController', () => {
  let controller: LeadRegistrationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeadRegistrationController],
    }).compile();

    controller = module.get<LeadRegistrationController>(LeadRegistrationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
