import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  Event,
  LeadCandidate,
  LeadCandidateStatus,
  Post,
  User,
} from 'src/shared/schema';
import { DashboardService } from './dashboard.service';

const makeCountQuery = (countResult: number) => ({
  exec: jest.fn().mockResolvedValue(countResult),
});

const makeFailingCountQuery = (errorMessage: string) => ({
  exec: jest.fn().mockRejectedValue(new Error(errorMessage)),
});

describe('DashboardService', () => {
  let service: DashboardService;

  let mockUserModel: any;
  let mockEventModel: any;
  let mockPostModel: any;
  let mockLeadCandidateModel: any;

  beforeEach(async () => {
    mockUserModel = {
      countDocuments: jest.fn(),
    };
    mockEventModel = {
      countDocuments: jest.fn(),
    };
    mockPostModel = {
      countDocuments: jest.fn(),
    };
    mockLeadCandidateModel = {
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: User.name, useValue: mockUserModel },
        { provide: Event.name, useValue: mockEventModel },
        { provide: Post.name, useValue: mockPostModel },
        { provide: LeadCandidate.name, useValue: mockLeadCandidateModel },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the correct stats when all tables/models resolve successfully', async () => {
    // UserModel calls:
    // 1st: leadsTotal -> 50
    // 2nd: leadsDeactivated -> 5
    // 3rd: directPendingApplications -> 2
    mockUserModel.countDocuments
      .mockReturnValueOnce(makeCountQuery(50))
      .mockReturnValueOnce(makeCountQuery(5))
      .mockReturnValueOnce(makeCountQuery(2));

    // LeadCandidateModel call: candidatePendingRecommendations (invited + pending) -> 3
    mockLeadCandidateModel.countDocuments.mockReturnValueOnce(makeCountQuery(3));

    // EventModel calls:
    // 1st: eventsUpcoming -> 4
    // 2nd: eventsPending -> 4
    mockEventModel.countDocuments
      .mockReturnValueOnce(makeCountQuery(4))
      .mockReturnValueOnce(makeCountQuery(4));

    // PostModel calls:
    // 1st: blogsPublished -> 35
    // 2nd: blogsPending -> 3
    mockPostModel.countDocuments
      .mockReturnValueOnce(makeCountQuery(35))
      .mockReturnValueOnce(makeCountQuery(3));

    const result = await service.getDashboardStats();

    expect(result).toEqual({
      leads: {
        total: 50,
        pending: 5, // 2 (direct) + 3 (candidates)
      },
      events: {
        upcoming: 4,
        pending: 4,
      },
      blogs: {
        published: 35,
        pending: 3,
      },
      deactivated: {
        total: 5,
      },
    });
  });

  it('should count invited and pending nominations without adding lead invitations', async () => {
    mockUserModel.countDocuments.mockReturnValue(makeCountQuery(0));
    mockLeadCandidateModel.countDocuments.mockReturnValueOnce(makeCountQuery(0));
    mockEventModel.countDocuments.mockReturnValue(makeCountQuery(0));
    mockPostModel.countDocuments.mockReturnValue(makeCountQuery(0));

    await service.getDashboardStats();

    expect(mockLeadCandidateModel.countDocuments).toHaveBeenCalledWith({
      status: {
        $in: [LeadCandidateStatus.PENDING, LeadCandidateStatus.INVITED],
      },
    });
  });

  it('should throw instead of reporting 0 when a collection count fails', async () => {
    mockUserModel.countDocuments.mockReturnValue(makeCountQuery(1));
    mockLeadCandidateModel.countDocuments.mockReturnValueOnce(makeCountQuery(1));

    // EventModel throws an error (e.g. database down, collection unavailable)
    mockEventModel.countDocuments.mockReturnValue(
      makeFailingCountQuery('Events collection connection lost'),
    );
    mockPostModel.countDocuments.mockReturnValue(makeCountQuery(1));

    await expect(service.getDashboardStats()).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
