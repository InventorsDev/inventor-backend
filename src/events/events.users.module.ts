import { Module } from '@nestjs/common';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { DBModule } from 'src/shared/schema';
import { EventAdminsController } from './events.admin.controller';
import { EventUserController } from './events.users.controller';
import { EventService } from './events.users.service';

@Module({
  imports: [DBModule, NotificationsModule],
  controllers: [EventUserController, EventAdminsController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
