import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { WebhooksController } from './webhooks.controller';
import { DsvaWebhookService } from './dsva.webook.service';
import { TestModule } from '../testkits';
import { DataLogsService } from '../datalogs';

describe('WebhooksController', () => {
  let webhooksController: WebhooksController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
      controllers: [WebhooksController],
      providers: [DsvaWebhookService],
    }).compile();

    webhooksController = app.get<WebhooksController>(
      WebhooksController,
    ) as WebhooksController;

    global.dataLogsService = app.get<DataLogsService>(DataLogsService);
    global.jwtService = app.get<JwtService>(JwtService);
  });

  describe('webhooksController', () => {
    it('should return true for webhooksController"', () => {
      expect(!!webhooksController).toBe(true);
    });
  });
});
