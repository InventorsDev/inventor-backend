import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersAdminsController } from './users.admin.controller';
import { DBModule } from 'src/shared/schema';
// need to accec module outside
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../shared/schema/user.schema';

@Module({
  imports: [DBModule, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [UsersController, UsersAdminsController],
  providers: [UsersService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
