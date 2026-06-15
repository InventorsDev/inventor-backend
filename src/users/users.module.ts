import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersAdminsController } from './users.admin.controller';
import { OurTeamController } from './our-team/our-team.controller';
import { OurTeamService } from './our-team/our-team.service';
import { DBModule } from 'src/shared/schema';

@Module({
  imports: [DBModule],
  controllers: [UsersController, UsersAdminsController, OurTeamController],
  providers: [UsersService, OurTeamService],
  exports: [UsersService],
})
export class UsersModule {}
