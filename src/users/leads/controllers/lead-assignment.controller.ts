import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LeadAssignmentService } from '../services/lead-assignment.service';
import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { ApiReq } from 'src/shared/interfaces';
import type { LeadRevokeReasonDto } from 'src/users/dto/lead-revoke-status.dto';

@Controller()
export class LeadAssignmentController {
  private readonly logger = new Logger(LeadAssignmentController.name);
  constructor(private readonly leadAssignmentService: LeadAssignmentService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Get('admin/lead-assignment')
  getAllLeads(@Query('sessionId') sessionId: string) {
    return this.leadAssignmentService.getAllLeads(sessionId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Post('admin/lead-assignment/:id/revoke')
  async revokeLead(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: ApiReq,
  ) {
    const adminId = req.user._id.toString();
    return this.leadAssignmentService.revokeLeadStatus(id, reason, adminId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Get('admin/lead-assignment/:id')
  getLead(@Param('id') id: string) {
    return this.leadAssignmentService.getLead(id);
  }
}
