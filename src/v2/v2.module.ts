import { Module } from '@nestjs/common';
import { V2Controller } from './v2.controller';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [DashboardModule],
  controllers: [V2Controller],
  providers: [],
  exports: [DashboardModule],
})
export class V2Module {}
