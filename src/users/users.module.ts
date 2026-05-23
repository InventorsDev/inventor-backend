import { Module } from '@nestjs/common';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { DBModule } from 'src/shared/schema';
import { UsersAdminsController } from './users.admin.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [DBModule, NotificationsModule],
  controllers: [UsersController, UsersAdminsController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
