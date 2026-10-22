import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardStatsResponseDto } from './dto/dashboard-stats.dto';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;
  let guard: JwtAdminsGuard;

  const mockStatsResponse: DashboardStatsResponseDto = {
    leads: { total: 50, pending: 5 },
    events: { upcoming: 4, pending: 4 },
    blogs: { published: 35, pending: 3 },
    deactivated: { total: 5 },
  };

  const mockDashboardService = {
    getDashboardStats: jest.fn().mockResolvedValue(mockStatsResponse),
  };

  beforeEach(async () => {
    // Ensure global.jwtService is available for JwtAdminsGuard
    global.jwtService = {
      verify: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
        {
          provide: JwtAdminsGuard,
          useValue: new JwtAdminsGuard(global.jwtService),
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
    guard = module.get<JwtAdminsGuard>(JwtAdminsGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v2/dashboard/stats controller method', () => {
    it('should return the correct stats from DashboardService', async () => {
      const result = await controller.getDashboardStats();
      expect(service.getDashboardStats).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockStatsResponse);
    });
  });

  describe('JwtAdminsGuard on endpoint', () => {
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

    it('should throw UnauthorizedException when no bearer token is provided', async () => {
      const context = createMockExecutionContext(undefined);
      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token is invalid or expired', async () => {
      const context = createMockExecutionContext('Bearer invalid.token');
      (global.jwtService.verify as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token role does not contain ADMIN', async () => {
      const context = createMockExecutionContext('Bearer valid.token');
      (global.jwtService.verify as jest.Mock).mockResolvedValue({
        role: ['USER'],
      });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should allow access when valid bearer token with ADMIN role is provided', async () => {
      const context = createMockExecutionContext('Bearer valid.admin.token');
      (global.jwtService.verify as jest.Mock).mockResolvedValue({
        role: ['ADMIN'],
        sub: 'admin123',
      });

      const canActivate = await guard.canActivate(context);
      expect(canActivate).toBe(true);
    });
  });
});
