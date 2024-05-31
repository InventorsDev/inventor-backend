import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Delete,
  Put,
  Patch,
  Inject,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EventService } from './events.users.service';
import { User, UserDocument } from 'src/shared/schema';
import { Model } from 'mongoose';
import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';

@ApiTags('admins')
@Controller('admins')
export class EventAdminsController {
  constructor(
    @Inject(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly usersService: EventService,
  ) {}


}
