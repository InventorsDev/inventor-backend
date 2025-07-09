import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './events.users.service';
import { EventUserController } from './events.users.controller';
import { TestModule } from 'src/shared/testkits';

describe('UsersController', () => {
  let controller: EventUserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
      controllers: [EventUserController],
      providers: [EventService],
    }).compile();

    controller = module.get<EventUserController>(EventUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
