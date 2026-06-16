import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EventService } from './events.users.service';
import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import { ApiReq } from 'src/shared/interfaces';
import { Status } from 'src/shared/interfaces/event.type';

@ApiTags('admins')
@Controller('admins')
export class EventAdminsController {
  constructor(private readonly eventService: EventService) {}

  // list events for moderation; ?status=PENDING surfaces events awaiting approval
  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @ApiQuery({ name: 'status', required: false, enum: Status })
  @ApiQuery({ name: 'page', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: String })
  @Get('events')
  async listEvents(@Req() req: ApiReq, @Query('status') status?: Status) {
    return this.eventService.findAllForAdmin(req, status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Patch('event/:id/approve')
  @ApiParam({ name: 'id', type: 'string' })
  async approveEvent(@Param('id') id: string) {
    return this.eventService.approveEvent(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Delete('event/:id')
  @ApiParam({ name: 'id', type: 'string' })
  async softDeleteEvent(@Param('id') id: string, @Request() req: ApiReq) {
    return this.eventService.softDeleteEvent(id, req);
  }
}
