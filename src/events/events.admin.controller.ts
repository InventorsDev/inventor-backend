import {
  Controller,
  Delete,
  Param,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import { ApiReq } from 'src/shared/interfaces';
import { EventService } from './events.users.service';

@ApiTags('admins')
@Controller('admins')
export class EventAdminsController {
  constructor(private readonly eventService: EventService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Patch('event/:id/approve')
  @ApiParam({ name: 'id', type: 'string' })
  async approveEvent(@Param('id') id: string, @Request() req: ApiReq) {
    const admin_id = req.user._id.toString();
    return this.eventService.approveEvent(id, admin_id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Delete('event/:id')
  @ApiParam({ name: 'id', type: 'string' })
  async softDeleteEvent(@Param('id') id: string) {
    return this.eventService.softDeleteEvent(id);
  }
}
