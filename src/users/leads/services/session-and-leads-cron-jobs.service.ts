import { Injectable, Logger } from '@nestjs/common';
import { SessionService } from './sessions.service';
import { LeadAssignmentService } from './lead-assignment.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SessionAndLeadsCron {
  private readonly logger = new Logger(SessionAndLeadsCron.name);

  constructor(
    private readonly sessionServie: SessionService,
    private readonly leadAssignmentService: LeadAssignmentService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleExpiredSessions() {
    this.logger.log('... running session check ...');
    const updatedSessions = await this.sessionServie.updateExpiredSessions();
    this.logger.log(`.... changed ${updatedSessions ?? 0} sessions.`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleExpiredLeads() {
    this.logger.log('... running leads check ...');
    const updatedLeads = await this.leadAssignmentService.updateExpiredLeads();
    this.logger.log(`.... changed ${updatedLeads ?? 0} leads.`);
  }
}
