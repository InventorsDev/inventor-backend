import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
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
  @Patch('event/:id/reject')
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOperation({
    summary: 'Reject an event',
    description: 'Reject an event with a reason',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Reason for rejection',
        },
      },
    },
  })
  async rejectEvent(
    @Param('id') id: string,
    @Request() req: ApiReq,
    @Body() body: { message?: string },
  ) {
    const admin_id = req.user._id.toString();
    const message = body.message || 'Event rejected';
    return this.eventService.rejectEvent(id, admin_id, message);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Delete('event/:id')
  @ApiParam({ name: 'id', type: 'string' })
  async softDeleteEvent(@Param('id') id: string) {
    return this.eventService.softDeleteEvent(id);
  }
}
