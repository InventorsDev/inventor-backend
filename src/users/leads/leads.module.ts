import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
