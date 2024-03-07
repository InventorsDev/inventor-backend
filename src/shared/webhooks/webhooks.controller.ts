import { Controller, HttpCode, Param, Post, Request } from '@nestjs/common';
import { DsvaWebhookService } from './dsva.webook.service';
import { ApiReq, WebhookSource, WebhookSources } from '../interfaces';
import { ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly dsvaWebhookService: DsvaWebhookService) {}

  @ApiParam({ name: 'source', enum: WebhookSources })
  @Post('/public/:source/events')
  @HttpCode(200)
  async listenToEvent(@Request() req: ApiReq, @Param('source') eventSource) {
    switch (eventSource.toUpperCase()) {
      case WebhookSource.DSVA:
        return this.dsvaWebhookService.processEvent(req);
      default:
        return false;
    }
  }
}
