import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Req,
  Patch,
  Delete,
} from '@nestjs/common';
import { EventService } from './events.users.service';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtEventUserGuard } from 'src/shared/auth/guards/jwt.event.users.guard';
import { ApiReq} from 'src/shared/interfaces';
import { EventDto } from './dto/event.dto';
import { UpdateEventDto } from './dto/updateEvent.dto';
import { JwtUsersGuard } from 'src/shared/auth/guards/jwt.users.guard';

@ApiTags('event')
@Controller('event')
export class EventUserController {
  constructor(private readonly eventService: EventService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtEventUserGuard)
  @Post()
  async createEvent(@Body() payload: EventDto) {
    return this.eventService.createEvent(payload);
  }

  @ApiBearerAuth()
  @Get()
  async getAllEvents(@Req() req: ApiReq) {
    return this.eventService.findAll(req);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: 'string' })
  async getEventById(@Param('id') id: string) {
    return this.eventService.findById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtEventUserGuard)
  @Patch(':id')
  @ApiParam({ name: 'id', type: 'string' })
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventService.updateEvent(id, updateEventDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtEventUserGuard)
  @Delete(':id')
  @ApiParam({ name: 'id', type: 'string' })
  async deleteEvent(@Param('id') id: string) {
    return this.eventService.deleteEvent(id);
  }

}

