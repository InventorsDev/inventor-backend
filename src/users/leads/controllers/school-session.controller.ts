import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionService } from '../services/sessions.service';
import type { SchoolSession } from 'src/shared/schema';
import { CreateSchoolSessionDto } from '../dto/create-session.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import type { ApiReq } from 'src/shared/interfaces';

@ApiBearerAuth()
@Controller('school-sessions')
export class SchoolSessionController {
  private readonly logger = new Logger(SchoolSessionController.name);

  constructor(private readonly sessionService: SessionService) {}

  @Get()
  async getAllSessions(): Promise<SchoolSession[]> {
    // TODO: make this accept pagination so i can speify shool, active etc
    return await this.sessionService.getActiveSessions();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Post('create')
  async createSession(
    @Body() data: CreateSchoolSessionDto,
    @Req() req: ApiReq,
  ): Promise<SchoolSession> {
    const adminId = req.user._id;
    return this.sessionService.createSession(data, adminId);
  }
}
