import { Module } from '@nestjs/common';
import { DBModule } from 'src/shared/schema';
import { PostModule } from 'src/blog/post/post.module';
import { EventModule } from 'src/events/events.users.module';
import { UsersModule } from 'src/users/users.module';
import { LeadsModule } from 'src/users/leads/leads.module';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';

@Module({
  imports: [DBModule, PostModule, EventModule, UsersModule, LeadsModule],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}

