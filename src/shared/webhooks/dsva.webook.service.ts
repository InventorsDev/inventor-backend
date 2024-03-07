import { Injectable, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { ApiReq, LogLevel } from '../interfaces';
import { Report, ReportDocument } from '../schema';
const crypto = require('crypto');

@Injectable()
export class DsvaWebhookService {
  constructor(
    @Inject(Report.name)
    private readonly reportModel: Model<ReportDocument>,
  ) {}

  async processEvent(req: ApiReq) {
    if (!this.verifyDsvaSignature(req)) return false;

    const loanInfo = req.body;
    const eventType = loanInfo.eventType;

    if (!loanInfo || !loanInfo?.data) return false;

    setImmediate(async () => {
      try {
        switch (eventType) {
          case 'report.updated':
            await this.reportStatusTrigger(loanInfo);
            break;
        }
      } catch (error) {
        global.dataLogsService.log(
          'DSVA_REPORT_WEBHOOK_INFO',
          {
            ...(loanInfo.object.id || {}),
            message: error.message,
            stack: error.stack,
            source: 'DSVA_REPORT_WEBHOOK_INFO',
          },
          LogLevel.ERROR,
        );
      }
    });

    return true;
  }

  private async reportStatusTrigger(reportInfo: any) {
    const loan = await this.reportModel.findOne(
      {
        dsvaId: reportInfo.id,
      },
      { dsvaId: 1 },
    );

    if (!loan) return false;

    await this.reportModel.updateOne(
      { dsvaId: reportInfo.id },
      { $set: { status: reportInfo.status } },
      {
        new: true,
        lean: true,
      },
    );

    return true;
  }

  private verifyDsvaSignature(req) {
    return true;
  }
}
