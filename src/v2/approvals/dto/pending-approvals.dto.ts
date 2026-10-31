import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum ApprovalItemType {
  ALL = 'all',
  BLOG = 'blog',
  EVENT = 'event',
  LEAD = 'lead',
}

export class PendingApprovalsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: ApprovalItemType, default: ApprovalItemType.ALL })
  @IsOptional()
  @IsEnum(ApprovalItemType)
  type?: ApprovalItemType = ApprovalItemType.ALL;
}

export class AuthorDto {
  @ApiProperty({ example: 'Elijah Asaolu' })
  name: string;

  @ApiProperty({ example: 'Software Engineer' })
  role: string;

  @ApiProperty({ example: 'https://example.com/avatars/elijah.png' })
  avatar_url?: string;
}

export class OrganizerDto {
  @ApiProperty({ example: 'Jane Doe' })
  name: string;

  @ApiProperty({ example: 'Google Meet' })
  platform?: string;

  @ApiProperty({ example: 'https://example.com/avatars/jane.png' })
  avatar_url?: string;
}

export class BlogMetadataDto {
  @ApiProperty({ example: '6 min read' })
  read_time: string;
}

export class EventMetadataDto {
  @ApiProperty({ example: 'July 12, 2025' })
  date: string;

  @ApiProperty({ example: '7pm' })
  time: string;
}

export class ApprovalItemDto {
  @ApiProperty({ example: 'item_101' })
  id: string;

  @ApiProperty({ enum: ['blog', 'event', 'lead'], example: 'blog' })
  type: 'blog' | 'event' | 'lead';

  @ApiProperty({ example: 'Beginners guide to becoming a professional Front-end Developer' })
  title: string;

  @ApiPropertyOptional({ example: 'https://example.com/images/blog1.png' })
  thumbnail_url?: string;

  @ApiPropertyOptional({ type: AuthorDto })
  author?: AuthorDto;

  @ApiPropertyOptional({ type: OrganizerDto })
  organizer?: OrganizerDto;

  @ApiPropertyOptional({ example: 'Product Designer' })
  role?: string;

  @ApiPropertyOptional({ example: 'josephdenzel@gmail.com' })
  email?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatars/joseph.png' })
  avatar_url?: string;

  @ApiPropertyOptional({ type: Object })
  metadata?: BlogMetadataDto | EventMetadataDto | Record<string, any>;

  @ApiProperty({ example: '2026-06-12T10:00:00Z' })
  created_at: string;
}

export class PendingApprovalsResponseDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 12 })
  total: number;

  @ApiProperty({ type: [ApprovalItemDto] })
  items: ApprovalItemDto[];
}
