import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { AdminLeadsController } from './controllers/admin-leads.controller';

@Module({
  controllers: [AdminLeadsController],
  providers: [LeadsService],
})
export class LeadsModule { }
