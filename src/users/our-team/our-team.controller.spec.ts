import { Test, TestingModule } from '@nestjs/testing';
import { OurTeamController } from './our-team.controller';
import { OurTeamService } from './our-team.service';
import { TeamMemberDto } from './dto/team-member.dto';

describe('OurTeamController', () => {
  let controller: OurTeamController;
  let service: jest.Mocked<OurTeamService>;

  const mockOurTeamService = {
    getTeam: jest.fn(),
    bulkUpload: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OurTeamController],
      providers: [
        {
          provide: OurTeamService,
          useValue: mockOurTeamService,
        },
      ],
    }).compile();

    controller = module.get<OurTeamController>(OurTeamController);
    service = module.get(OurTeamService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTeam', () => {
    it('should return all team members', async () => {
      const team: TeamMemberDto[] = [
        {
          fullName: 'John Doe',
          role: 'Backend Lead',
        } as TeamMemberDto,
      ];

      service.getTeam.mockResolvedValue(team);

      const result = await controller.getTeam();

      expect(service.getTeam).toHaveBeenCalledTimes(1);
      expect(result).toEqual(team);
    });
  });

  describe('bulkUpload', () => {
    it('should upload csv file and return result', async () => {
      const file = {
        originalname: 'team.csv',
        mimetype: 'text/csv',
        buffer: Buffer.from('name,email'),
      } as Express.Multer.File;

      const uploadResult = {
        totalRows: 1,
        created: 1,
        updated: 0,
        failed: 0,
        errors: [],
      };

      service.bulkUpload.mockResolvedValue(uploadResult as any);

      const result = await controller.bulkUpload(file);

      expect(service.bulkUpload).toHaveBeenCalledTimes(1);
      expect(service.bulkUpload).toHaveBeenCalledWith(file);
      expect(result).toEqual(uploadResult);
    });
  });
});
