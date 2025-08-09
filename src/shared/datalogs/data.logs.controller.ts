import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { DataLogsService } from './data.logs.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
// import { JwtAdminsGuard, JwtUsersGuard } from '../auths';
import { dataLogTypes, ApiReq } from '../interfaces';
import { JwtAdminsGuard } from '../auth/guards/jwt.admins.guard';
import { JwtUsersGuard } from '../auth/guards/jwt.users.guard';

@Controller()
export class DataLogsController {
  constructor(private readonly logsService: DataLogsService) {}

  @ApiOperation({
    summary: 'Get all logs',
    description:
      'Gets all available logs with admin privileges;' +
      'can be filtered by proper specified (optional) filters.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @ApiQuery({ name: 'limit', required: false, type: String } as any)
  @ApiQuery({ name: 'page', required: false, type: String } as any)
  @ApiQuery({
    name: 'order',
    required: false,
    type: String,
    enum: ['ASC', 'DESC'],
  } as any)
  @ApiQuery({
    name: 'logTraceId',
    required: false,
    type: String,
  } as any)
  @ApiQuery({
    name: 'logTypes',
    required: false,
    type: String,
    description: `Separated by comma. ${dataLogTypes}`,
  } as any)
  @ApiQuery({
    name: 'logSearch',
    required: false,
    type: String,
  } as any)
  @ApiQuery({
    name: 'logLevel',
    required: false,
    enum: ['INFO', 'ERROR'],
    type: String,
  } as any)
  @ApiQuery({
    name: 'logApiMethod',
    required: false,
    type: String,
  } as any)
  @ApiQuery({
    name: 'logStatusCode',
    required: false,
    type: String,
  } as any)
  @ApiQuery({
    name: 'logIpAddress',
    required: false,
    type: String,
  } as any)
  @ApiQuery({
    name: 'dataLogDateRange',
    required: false,
    type: String,
    description: 'e.g: 2020-11-12,2022-11-15',
  } as any)
  @ApiTags('admins')
  @Get('admins/data-logs')
  findAll(@Request() req: ApiReq) {
    return this.logsService.findAll(req);
  }

  @ApiOperation({
    summary: 'Get public logs (user)',
    description: 'Gets all public logs with user privileges. Requires a `logSource` to be specified.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtUsersGuard)
  @ApiTags('users')
  @Post('users/:logSource/logs')
  logUser(@Request() req: ApiReq, @Param('logSource') source: string) {
    return this.logsService.publicLog(req, source);
  }

  @ApiOperation({
    summary: 'Get public logs (admin)',
    description: 'Gets all public logs with admin privileges. Requires a `logSource` to be specified.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @ApiTags('admins')
  @Post('admins/:logSource/logs')
  logAdmin(@Request() req: ApiReq, @Param('logSource') source: string) {
    return this.logsService.publicLog(req, source);
  }

  @ApiOperation({
    summary: 'Delete a log',
    description: 'Deletes a log with admin privileges by ID.',
  })
  @ApiBearerAuth()
  // @UseGuards(JwtAdminsGuard)
  @ApiTags('admins')
  @Delete('admins/data-logs/:dataLogId')
  remove(@Param('dataLogId') dataLogId: string) {
    return this.logsService.remove(dataLogId);
  }
}
