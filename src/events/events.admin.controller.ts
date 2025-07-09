import { Controller, UseGuards, Param, Delete, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { EventService } from './events.users.service';
import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';

@ApiTags('admins')
@Controller('admins')
export class EventAdminsController {
  constructor(private readonly eventService: EventService) {}

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
  async softDeleteEvent(@Param('id') id: string) {
    return this.eventService.softDeleteEvent(id);
  }
}
