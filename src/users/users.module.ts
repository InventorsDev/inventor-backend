import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersAdminsController } from './users.admin.controller';
import { DBModule } from 'src/shared/schema';

@Module({
  imports: [DBModule],
  controllers: [UsersController, UsersAdminsController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
