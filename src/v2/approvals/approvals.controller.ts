import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import { ApiReq } from 'src/shared/interfaces';
import { ApprovalsService } from './approvals.service';
import {
  PendingApprovalsQueryDto,
  PendingApprovalsResponseDto,
} from './dto/pending-approvals.dto';
import {
  ApprovalActionResultDto,
  ApproveApprovalDto,
  RejectApprovalDto,
} from './dto/approval-action.dto';

@ApiTags('v2')
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @ApiOperation({
    summary: 'Get pending approval items',
    description: 'Retrieves a paginated list of items waiting for approval (blogs, events, leads). Admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated pending approvals retrieved successfully.',
    type: PendingApprovalsResponseDto,
  })
  @Get('pending')
  async getPendingApprovals(
    @Query() query: PendingApprovalsQueryDto,
  ): Promise<PendingApprovalsResponseDto> {
    return this.approvalsService.getPendingApprovals(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @ApiOperation({
    summary: 'Approve a pending item',
    description: 'Approves a pending blog, event, or lead application/nomination. Admin only.',
  })
  @ApiParam({ name: 'id', description: 'ID of the pending approval item' })
  @ApiResponse({
    status: 200,
    description: 'Item approved successfully.',
    type: ApprovalActionResultDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request or state transition.' })
  @ApiResponse({ status: 404, description: 'Pending approval item not found.' })
  @Post(':id/approve')
  async approveItem(
    @Param('id') id: string,
    @Req() req: ApiReq,
    @Body() dto?: ApproveApprovalDto,
  ): Promise<ApprovalActionResultDto> {
    const adminId = (req.user?._id || req.user?.id || (req.user as any)?.sub)?.toString() || '';
    return this.approvalsService.approveItem(id, adminId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @ApiOperation({
    summary: 'Reject or remove a pending item',
    description: 'Rejects or removes a pending blog, event, or lead nomination/application. Admin only.',
  })
  @ApiParam({ name: 'id', description: 'ID of the pending approval item' })
  @ApiResponse({
    status: 200,
    description: 'Item rejected/removed successfully.',
    type: ApprovalActionResultDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request or state transition.' })
  @ApiResponse({ status: 404, description: 'Pending approval item not found.' })
  @Delete(':id')
  async rejectItem(
    @Param('id') id: string,
    @Req() req: ApiReq,
    @Body() dto?: RejectApprovalDto,
  ): Promise<ApprovalActionResultDto> {
    const adminId = (req.user?._id || req.user?.id || (req.user as any)?.sub)?.toString() || '';
    return this.approvalsService.rejectItem(id, adminId, req, dto);
  }
}

