import { Module } from '@nestjs/common';
import { V2Controller } from './v2.controller';
import { DashboardModule } from './dashboard/dashboard.module';
import { ApprovalsModule } from './approvals/approvals.module';

@Module({
  imports: [DashboardModule, ApprovalsModule],
  controllers: [V2Controller],
  providers: [],
  exports: [DashboardModule, ApprovalsModule],
})
export class V2Module {}
