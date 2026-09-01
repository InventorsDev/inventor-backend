import {
  Controller,
  Get,
  Logger,
  Param,
  ParseEnumPipe,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { SchoolNames } from 'src/shared/schema';
import { LeadAssignmentService } from '../services/lead-assignment.service';
import { IsNotEmpty } from 'class-validator';

@Controller('leads')
export class LeadsController {
  private readonly logger = new Logger(LeadsController.name);

  constructor(private readonly leadAssignmentService: LeadAssignmentService) {}

  @Get('/current')
  async getCurretnLeads(@Query('school') school: SchoolNames) {
    return this.leadAssignmentService.getActiveLeadsForSchool(school);
  }

  @Get('/:sessionId')
  async getLeadsForSession(@Param('sessionId') sessionId: string) {
    return this.leadAssignmentService.getAllLeads(sessionId);
  }

  @Get('/history')
  async getLeadHistory(
    @Query('school', new ParseEnumPipe(SchoolNames))
    school: SchoolNames,
  ) {
    return this.leadAssignmentService.getLeadHistory(school);
  }
}
