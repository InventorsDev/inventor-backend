import { ApiProperty } from '@nestjs/swagger';

export class LeadStatsDto {
  @ApiProperty({ description: 'Total number of active or expired leads not deactivated/suspended', example: 50 })
  total: number;

  @ApiProperty({ description: 'Total number of pending lead applications (invites, recommendations, and direct)', example: 5 })
  pending: number;
}

export class EventStatsDto {
  @ApiProperty({ description: 'Total number of upcoming approved events', example: 4 })
  upcoming: number;

  @ApiProperty({ description: 'Total number of pending events', example: 4 })
  pending: number;
}

export class BlogStatsDto {
  @ApiProperty({ description: 'Total number of published/approved blogs', example: 35 })
  published: number;

  @ApiProperty({ description: 'Total number of pending blogs', example: 3 })
  pending: number;
}

export class DeactivatedStatsDto {
  @ApiProperty({ description: 'Total number of deactivated leads', example: 5 })
  total: number;
}

export class DashboardStatsResponseDto {
  @ApiProperty({ type: LeadStatsDto })
  leads: LeadStatsDto;

  @ApiProperty({ type: EventStatsDto })
  events: EventStatsDto;

  @ApiProperty({ type: BlogStatsDto })
  blogs: BlogStatsDto;

  @ApiProperty({ type: DeactivatedStatsDto })
  deactivated: DeactivatedStatsDto;
}
