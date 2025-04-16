import { Test, TestingModule } from '@nestjs/testing';
import { DataLogsController } from './data.logs.controller';
import { DataLogsService } from './data.logs.service';
import { JwtAdminsGuard } from '../auth/guards/jwt.admins.guard';
import { JwtUsersGuard } from '../auth/guards/jwt.users.guard';
import { NotFoundException } from '@nestjs/common';

describe('DataLogsController', () => {
  let controller: DataLogsController;
  let logsService: DataLogsService;

  const mockLogsService = {
    findAll: jest.fn(),
    publicLog: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataLogsController],
      providers: [
        {
          provide: DataLogsService,
          useValue: mockLogsService,
        },
      ],
    }).compile();

    controller = module.get<DataLogsController>(DataLogsController);
    logsService = module.get<DataLogsService>(DataLogsService);
  });

  describe('findAll', () => {
    it('should return all logs for admins', async () => {
      const mockResponse = [{ id: '1', message: 'Log entry' }];
      mockLogsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll({ query: {} } as any);
      expect(result).toEqual(mockResponse);
      expect(logsService.findAll).toHaveBeenCalledWith({ query: {} });
    });
  });

  describe('logUser', () => {
    it('should log a user activity', async () => {
      const mockRequest = { body: { message: 'User action' } };
      const mockSource = 'user-app';
      mockLogsService.publicLog.mockResolvedValue({ success: true });

      const result = await controller.logUser(mockRequest as any, mockSource);
      expect(result).toEqual({ success: true });
      expect(logsService.publicLog).toHaveBeenCalledWith(
        mockRequest,
        mockSource,
      );
    });
  });

  describe('logAdmin', () => {
    it('should log an admin activity', async () => {
      const mockRequest = { body: { message: 'Admin action' } };
      const mockSource = 'admin-dashboard';
      mockLogsService.publicLog.mockResolvedValue({ success: true });

      const result = await controller.logAdmin(mockRequest as any, mockSource);
      expect(result).toEqual({ success: true });
      expect(logsService.publicLog).toHaveBeenCalledWith(
        mockRequest,
        mockSource,
      );
    });
  });

  describe('remove', () => {
    it('should remove a data log by ID', async () => {
      const mockLogId = 'log123';
      mockLogsService.remove.mockResolvedValue({ success: true });

      const result = await controller.remove(mockLogId);
      expect(result).toEqual({ success: true });
      expect(logsService.remove).toHaveBeenCalledWith(mockLogId);
    });

    it('should throw NotFoundException if log is not found', async () => {
      mockLogsService.remove.mockImplementationOnce(() => {
        throw new NotFoundException('Log not found');
      });

      await expect(controller.remove('invalid-log-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
