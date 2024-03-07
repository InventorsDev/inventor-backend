import { Module } from '@nestjs/common';
import { DataLogsService } from './data.logs.service';
import { DataLogsController } from './data.logs.controller';
import { DBModule } from '../schema';

@Module({
  imports: [DBModule],
  controllers: [DataLogsController],
  providers: [DataLogsService],
  exports: [DataLogsService],
})
export class DataLogsModule {}
