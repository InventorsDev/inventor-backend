import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseEnumPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  LeadAssignment,
  SchoolNames,
  type LeadContribution,
} from 'src/shared/schema';
import { LeadAssignmentService } from '../services/lead-assignment.service';
import type { ApiReq } from 'src/shared/interfaces';
import { JwtUsersGuard } from 'src/shared/auth/guards/jwt.users.guard';
import { LeadContributionService } from '../services/lead-contirbution.service';
import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { CreateLeadContributionDto } from 'src/users/dto/create-contribution.dto';

@Controller()
export class LeadsController {
  private readonly logger = new Logger(LeadsController.name);

  constructor(
    private readonly leadAssignmentService: LeadAssignmentService,
    private readonly leadContributionService: LeadContributionService,
  ) {}

  @Get('leads/current')
  async getCurretnLeads(@Query('school') school: SchoolNames) {
    return this.leadAssignmentService.getActiveLeadsForSchool(school);
  }

  @Get('leads/history')
  async getLeadHistory(
    @Query('school', new ParseEnumPipe(SchoolNames))
    school: SchoolNames,
  ) {
    return this.leadAssignmentService.getLeadHistory(school);
  }

  @Get('leads/:sessionId')
  async getLeadsForSession(@Param('sessionId') sessionId: string) {
    return this.leadAssignmentService.getAllLeads(sessionId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtUsersGuard)
  @Get('me/lead-assignments')
  async(
    @Req() req: ApiReq,
    @Query('now') now: string,
  ): Promise<LeadAssignment[] | LeadAssignment> {
    const current = now !== 'true' ? false : true;
    const userId = req.user._id;
    return this.leadAssignmentService.getMyAssignments(userId, current);
  }

  @ApiBearerAuth()
  @UseGuards(JwtUsersGuard)
  @Get('me/lead-contributions')
  async getContributions(@Req() req: ApiReq): Promise<LeadContribution[]> {
    const userId = req.user._id;
    return await this.leadContributionService.getUserContributions(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Get('me/lead-contributions')
  async createContribution(
    @Req() req: ApiReq,
    @Body() data: CreateLeadContributionDto,
  ): Promise<LeadContribution> {
    const adminId = req.user._id;
    return await this.leadContributionService.createUserContribution(
      data,
      adminId,
    );
  }
}
