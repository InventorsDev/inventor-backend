import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import { DashboardService } from './dashboard.service';
import { DashboardStatsResponseDto } from './dto/dashboard-stats.dto';

@ApiTags('v2')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description: 'Retrieves aggregated metrics for leads, events, blogs, and deactivated leads. Admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully.',
    type: DashboardStatsResponseDto,
  })
  @Get('stats')
  async getDashboardStats(): Promise<DashboardStatsResponseDto> {
    return this.dashboardService.getDashboardStats();
  }
}
