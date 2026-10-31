import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import { ApiReq } from 'src/shared/interfaces';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import {
  ApprovalItemType,
  PendingApprovalsResponseDto,
} from './dto/pending-approvals.dto';
import { ApprovalActionResultDto } from './dto/approval-action.dto';

describe('ApprovalsController', () => {
  let controller: ApprovalsController;
  let service: ApprovalsService;
  let guard: JwtAdminsGuard;

  const mockResponse: PendingApprovalsResponseDto = {
    page: 1,
    limit: 10,
    total: 3,
    items: [],
  };

  const mockActionResult: ApprovalActionResultDto = {
    success: true,
    message: 'Item processed successfully',
    id: 'item_101',
    type: 'blog',
  };

  const mockApprovalsService = {
    getPendingApprovals: jest.fn().mockResolvedValue(mockResponse),
    approveItem: jest.fn().mockResolvedValue(mockActionResult),
    rejectItem: jest.fn().mockResolvedValue(mockActionResult),
  };

  const mockAdminReq = {
    user: {
      _id: 'admin_123',
      role: ['ADMIN'],
    },
  } as unknown as ApiReq;

  beforeEach(async () => {
    global.jwtService = {
      verify: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApprovalsController],
      providers: [
        {
          provide: ApprovalsService,
          useValue: mockApprovalsService,
        },
        {
          provide: JwtAdminsGuard,
          useValue: new JwtAdminsGuard(global.jwtService),
        },
      ],
    }).compile();

    controller = module.get<ApprovalsController>(ApprovalsController);
    service = module.get<ApprovalsService>(ApprovalsService);
    guard = module.get<JwtAdminsGuard>(JwtAdminsGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v2/approvals/pending', () => {
    it('should return pending approvals from ApprovalsService', async () => {
      const query = { page: 1, limit: 10, type: ApprovalItemType.ALL };
      const result = await controller.getPendingApprovals(query);
      expect(service.getPendingApprovals).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('POST /api/v2/approvals/:id/approve', () => {
    it('should delegate approval to ApprovalsService', async () => {
      const dto = { type: ApprovalItemType.BLOG };
      const result = await controller.approveItem('item_101', mockAdminReq, dto);
      expect(service.approveItem).toHaveBeenCalledWith('item_101', 'admin_123', dto);
      expect(result).toEqual(mockActionResult);
    });
  });

  describe('DELETE /api/v2/approvals/:id', () => {
    it('should delegate rejection to ApprovalsService', async () => {
      const dto = { reason: 'Irrelevant topic' };
      const result = await controller.rejectItem('item_101', mockAdminReq, dto);
      expect(service.rejectItem).toHaveBeenCalledWith('item_101', 'admin_123', mockAdminReq, dto);
      expect(result).toEqual(mockActionResult);
    });
  });

  describe('JwtAdminsGuard authentication', () => {
    const createMockExecutionContext = (authHeader?: string): ExecutionContext => {
      const request = {
        headers: {
          authorization: authHeader,
        },
      };
      return {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as unknown as ExecutionContext;
    };

    it('should throw UnauthorizedException when no bearer token is present', async () => {
      const context = createMockExecutionContext(undefined);
      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token role does not include ADMIN', async () => {
      const context = createMockExecutionContext('Bearer token');
      (global.jwtService.verify as jest.Mock).mockResolvedValue({ role: ['USER'] });
      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should allow access when bearer token with ADMIN role is provided', async () => {
      const context = createMockExecutionContext('Bearer valid.admin.token');
      (global.jwtService.verify as jest.Mock).mockResolvedValue({ role: ['ADMIN'] });
      const canActivate = await guard.canActivate(context);
      expect(canActivate).toBe(true);
    });
  });
});
