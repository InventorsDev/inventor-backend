import { Module } from '@nestjs/common';
import { EventService } from './events.users.service';
import { EventUserController } from './events.users.controller';
import { EventAdminsController } from './events.admin.controller';
import { DBModule } from 'src/shared/schema';

@Module({
  imports: [
    DBModule
  ],
  controllers: [EventUserController, EventAdminsController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
