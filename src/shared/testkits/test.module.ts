import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DataLogsModule } from '../datalogs';
import { DBModule } from '../schema';

@Module({
  imports: [DBModule, AuthModule, DataLogsModule],
  exports: [AuthModule, DataLogsModule, DBModule],
})
export class TestModule {}
