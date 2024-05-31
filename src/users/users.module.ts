import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersAdminsController } from './users.admin.controller';
import { DBModule } from 'src/shared/schema';
import {LinkSchema} from './link.model';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [DBModule, 
    MongooseModule.forFeature([{ name: 'Link', schema: LinkSchema }]),
  ],
  controllers: [UsersController, UsersAdminsController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
