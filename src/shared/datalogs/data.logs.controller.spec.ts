import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { TestModule } from '../testkits';
import { DataLogsController } from './data.logs.controller';
import { DataLogsService } from './data.logs.service';

describe('DataLogsController', () => {
  let dataLogsController: DataLogsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
      controllers: [DataLogsController],
      providers: [DataLogsService],
    }).compile();

    dataLogsController = app.get<DataLogsController>(
      DataLogsController,
    ) as DataLogsController;

    global.dataLogsService = app.get<DataLogsService>(DataLogsService);
    global.jwtService = app.get<JwtService>(JwtService);
  });

  describe('dataLogsController', () => {
    it('should return true for dataLogsController"', () => {
      expect(!!dataLogsController).toBe(true);
    });
  });

  describe('remove', () => {
    it('should call logsService.remove with the provided dataLogId', async () => {
      const dataLogId = 'some-log-id';
      const mockResult = { id: dataLogId, message: 'Log deleted' };
      const removeSpy = jest
        .spyOn(global.dataLogsService, 'remove')
        .mockResolvedValue(mockResult as any);

      const result = await dataLogsController.remove(dataLogId);

      expect(result).toEqual(mockResult);
      expect(removeSpy).toHaveBeenCalledWith(dataLogId);
    });
  });
});
