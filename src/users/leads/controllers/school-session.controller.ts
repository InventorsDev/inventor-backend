import { Body, Controller, Get, Logger, Post, Req } from '@nestjs/common';
import { SessionService } from '../services/sessions.service';
import type { SchoolSession } from 'src/shared/schema';
import type { CreateSchoolSessionDto } from '../dto/create-session.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';

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

  @Post('create')
  async createSession(
    @Body() data: CreateSchoolSessionDto,
    @Req() req: Request,
  ): Promise<SchoolSession> {
    console.log('==============================');
    console.log('CONTENT TYPE:', req.headers['content-type']);
    console.log('BODY:', data);
    console.log('==============================');

    return this.sessionService.createSession(data);
  }
}
