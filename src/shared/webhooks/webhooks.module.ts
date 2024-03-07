import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { DsvaWebhookService } from './dsva.webook.service';
import { DBModule } from '../schema';

@Module({
  imports: [DBModule],
  controllers: [WebhooksController],
  providers: [DsvaWebhookService],
  exports: [DsvaWebhookService],
})
export class WebhooksModule {}
