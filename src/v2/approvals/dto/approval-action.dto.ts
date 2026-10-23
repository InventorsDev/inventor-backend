import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApprovalItemType } from './pending-approvals.dto';

export class ApproveApprovalDto {
  @ApiPropertyOptional({
    enum: [ApprovalItemType.BLOG, ApprovalItemType.EVENT, ApprovalItemType.LEAD],
    description: 'Optional explicit type of the approval item. If omitted, the system will auto-detect across models.',
    example: 'blog',
  })
  @IsOptional()
  @IsEnum([ApprovalItemType.BLOG, ApprovalItemType.EVENT, ApprovalItemType.LEAD])
  type?: ApprovalItemType;
}

export class RejectApprovalDto {
  @ApiPropertyOptional({
    enum: [ApprovalItemType.BLOG, ApprovalItemType.EVENT, ApprovalItemType.LEAD],
    description: 'Optional explicit type of the approval item. If omitted, the system will auto-detect across models.',
    example: 'event',
  })
  @IsOptional()
  @IsEnum([ApprovalItemType.BLOG, ApprovalItemType.EVENT, ApprovalItemType.LEAD])
  type?: ApprovalItemType;

  @ApiPropertyOptional({
    description: 'Optional reason for rejection or removal.',
    example: 'Content does not meet our community submission guidelines.',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ApprovalActionResultDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Event approved successfully' })
  message: string;

  @ApiProperty({ example: '60d0fe4f5311236168a109ca' })
  id: string;

  @ApiProperty({ example: 'event' })
  type: string;
}
