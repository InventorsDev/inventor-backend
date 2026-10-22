import { Test, TestingModule } from '@nestjs/testing';
import {
  Event,
  LeadCandidate,
  LeadInvitation,
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
  let mockLeadInvitationModel: any;

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
    mockLeadInvitationModel = {
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: User.name, useValue: mockUserModel },
        { provide: Event.name, useValue: mockEventModel },
        { provide: Post.name, useValue: mockPostModel },
        { provide: LeadCandidate.name, useValue: mockLeadCandidateModel },
        { provide: LeadInvitation.name, useValue: mockLeadInvitationModel },
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

    // LeadCandidateModel call: candidatePendingRecommendations -> 2
    mockLeadCandidateModel.countDocuments.mockReturnValueOnce(makeCountQuery(2));

    // LeadInvitationModel call: invitationPending -> 1
    mockLeadInvitationModel.countDocuments.mockReturnValueOnce(makeCountQuery(1));

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
        pending: 5, // 2 (direct) + 2 (candidates) + 1 (invitations)
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

  it('should default to 0 for unavailable table/collection and return remaining stats without throwing', async () => {
    // Simulate failure on Event table/collection
    mockUserModel.countDocuments
      .mockReturnValueOnce(makeCountQuery(10))
      .mockReturnValueOnce(makeCountQuery(2))
      .mockReturnValueOnce(makeCountQuery(1));

    mockLeadCandidateModel.countDocuments.mockReturnValueOnce(makeCountQuery(1));
    mockLeadInvitationModel.countDocuments.mockReturnValueOnce(makeCountQuery(1));

    // EventModel throws an error (e.g. database down, collection unavailable)
    mockEventModel.countDocuments
      .mockReturnValueOnce(makeFailingCountQuery('Events collection connection lost'))
      .mockReturnValueOnce(makeFailingCountQuery('Events collection connection lost'));

    // PostModel succeeds
    mockPostModel.countDocuments
      .mockReturnValueOnce(makeCountQuery(20))
      .mockReturnValueOnce(makeCountQuery(2));

    const result = await service.getDashboardStats();

    expect(result).toEqual({
      leads: {
        total: 10,
        pending: 3,
      },
      events: {
        upcoming: 0, // defaulted to 0
        pending: 0,  // defaulted to 0
      },
      blogs: {
        published: 20,
        pending: 2,
      },
      deactivated: {
        total: 2,
      },
    });
  });
});
