import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { PostService } from 'src/blog/post/post.service';
import { EventService } from 'src/events/events.users.service';
import { ApiReq } from 'src/shared/interfaces';
import { Status as EventStatus } from 'src/shared/interfaces/event.type';
import { Status as PostStatus } from 'src/shared/interfaces/post.type';
import { ApplicationStatus } from 'src/shared/interfaces/user.type';
import { Event, LeadCandidate, Post, User } from 'src/shared/schema';
import { CandidateService } from 'src/users/leads/services/candidate.service';
import { UsersService } from 'src/users/users.service';
import { ApprovalsService } from './approvals.service';
import { ApprovalItemType } from './dto/pending-approvals.dto';

const makeFindOneMock = (record: any) => ({
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(record),
});

describe('ApprovalsService', () => {
  let service: ApprovalsService;

  let mockPostModel: any;
  let mockEventModel: any;
  let mockUserModel: any;
  let mockLeadCandidateModel: any;

  let mockPostService: any;
  let mockEventService: any;
  let mockUsersService: any;
  let mockCandidateService: any;

  const validObjectId = new Types.ObjectId().toString();

  const mockAdminReq = {
    user: { _id: validObjectId, role: ['ADMIN'] },
  } as unknown as ApiReq;

  beforeEach(async () => {
    mockPostModel = {
      find: jest.fn(),
      findById: jest.fn(),
    };
    mockEventModel = {
      find: jest.fn(),
      findById: jest.fn(),
    };
    mockUserModel = {
      find: jest.fn(),
      findById: jest.fn(),
    };
    mockLeadCandidateModel = {
      find: jest.fn(),
      findById: jest.fn(),
    };

    mockPostService = {
      approvePost: jest.fn().mockResolvedValue({}),
      softDeletePost: jest.fn().mockResolvedValue({}),
    };
    mockEventService = {
      approveEvent: jest.fn().mockResolvedValue({}),
      softDeleteEvent: jest.fn().mockResolvedValue({}),
    };
    mockUsersService = {
      approveTempApplication: jest.fn().mockResolvedValue('Verified lead'),
      rejectTempApplication: jest.fn().mockResolvedValue('Rejected lead'),
    };
    mockCandidateService = {
      approveCandidate: jest.fn().mockResolvedValue(true),
      rejectCandidate: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalsService,
        { provide: Post.name, useValue: mockPostModel },
        { provide: Event.name, useValue: mockEventModel },
        { provide: User.name, useValue: mockUserModel },
        { provide: LeadCandidate.name, useValue: mockLeadCandidateModel },
        { provide: PostService, useValue: mockPostService },
        { provide: EventService, useValue: mockEventService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: CandidateService, useValue: mockCandidateService },
      ],
    }).compile();

    service = module.get<ApprovalsService>(ApprovalsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPendingApprovals', () => {
    const makeFindMock = (records: any[]) => {
      const query: any = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn(),
      };
      query.limit = jest.fn((n: number) => {
        query.exec.mockResolvedValue(records.slice(0, n));
        return query;
      });
      query.exec.mockResolvedValue(records);
      return query;
    };
    const makeCountMock = (count: number) => ({
      exec: jest.fn().mockResolvedValue(count),
    });
    const at = (day: number) => new Date(Date.UTC(2026, 0, day));

    beforeEach(() => {
      mockPostModel.countDocuments = jest.fn();
      mockEventModel.countDocuments = jest.fn();
      mockUserModel.countDocuments = jest.fn();
      mockLeadCandidateModel.countDocuments = jest.fn();
    });

    it('should merge sources newest first, page them, and total from counts', async () => {
      mockPostModel.find.mockReturnValue(
        makeFindMock([
          { _id: 'b2', title: 'Blog 2', createdAt: at(6) },
          { _id: 'b1', title: 'Blog 1', createdAt: at(3) },
        ]),
      );
      mockEventModel.find.mockReturnValue(
        makeFindMock([{ _id: 'e1', title: 'Event 1', createdAt: at(5) }]),
      );
      mockUserModel.find.mockReturnValue(
        makeFindMock([{ _id: 'u1', email: 'u1@x.com', createdAt: at(4) }]),
      );
      mockLeadCandidateModel.find.mockReturnValue(makeFindMock([]));
      mockPostModel.countDocuments.mockReturnValue(makeCountMock(2));
      mockEventModel.countDocuments.mockReturnValue(makeCountMock(1));
      mockUserModel.countDocuments.mockReturnValue(makeCountMock(1));
      mockLeadCandidateModel.countDocuments.mockReturnValue(makeCountMock(0));

      const result = await service.getPendingApprovals({
        page: 2,
        limit: 2,
        type: ApprovalItemType.ALL,
      });

      expect(result.total).toBe(4);
      expect(result.items.map((i) => i.id)).toEqual(['u1', 'b1']);
      // Each source is limited in the database to page * limit documents.
      expect(mockPostModel.find.mock.results[0].value.limit).toHaveBeenCalledWith(4);
    });

    it('should list nominations with the nominee name and recommended position', async () => {
      const nomineeUserId = new Types.ObjectId();
      mockUserModel.find
        .mockReturnValueOnce(makeFindMock([]))
        .mockReturnValueOnce(
          makeFindMock([
            {
              _id: nomineeUserId,
              basicInfo: { firstName: 'Ada', lastName: 'Lovelace' },
            },
          ]),
        );
      mockLeadCandidateModel.find.mockReturnValue(
        makeFindMock([
          {
            _id: 'c1',
            email: 'ada@x.com',
            userId: nomineeUserId,
            recommendedFor: 'Lead',
            createdAt: at(2),
          },
          { _id: 'c2', email: 'new@x.com', createdAt: at(1) },
        ]),
      );
      mockUserModel.countDocuments.mockReturnValue(makeCountMock(0));
      mockLeadCandidateModel.countDocuments.mockReturnValue(makeCountMock(2));

      const result = await service.getPendingApprovals({
        type: ApprovalItemType.LEAD,
      });

      expect(result.total).toBe(2);
      expect(result.items).toMatchObject([
        { id: 'c1', title: 'Ada Lovelace', role: 'Lead', email: 'ada@x.com' },
        { id: 'c2', title: 'new@x.com', role: 'Nominee' },
      ]);
    });

    it('should throw instead of returning an empty list when a query fails', async () => {
      const failingQuery = makeFindMock([]);
      failingQuery.limit = jest.fn().mockReturnThis();
      failingQuery.exec.mockRejectedValue(new Error('connection lost'));
      mockPostModel.find.mockReturnValue(failingQuery);
      mockPostModel.countDocuments.mockReturnValue(makeCountMock(0));

      await expect(
        service.getPendingApprovals({ type: ApprovalItemType.BLOG }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('approveItem', () => {
    it('should approve a blog when found', async () => {
      mockPostModel.findById.mockReturnValue(
        makeFindOneMock({
          _id: validObjectId,
          title: 'Test Post',
          status: PostStatus.PENDING,
        }),
      );

      const result = await service.approveItem(validObjectId, 'admin_1');

      expect(mockPostService.approvePost).toHaveBeenCalledWith(validObjectId);
      expect(result.success).toBe(true);
      expect(result.type).toBe('blog');
    });

    it('should throw BadRequestException when blog is not pending', async () => {
      mockPostModel.findById.mockReturnValue(
        makeFindOneMock({
          _id: validObjectId,
          title: 'Test Post',
          status: PostStatus.APPROVED,
        }),
      );

      await expect(
        service.approveItem(validObjectId, 'admin_1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should approve an event when blog is not found', async () => {
      mockPostModel.findById.mockReturnValue(makeFindOneMock(null));
      mockEventModel.findById.mockReturnValue(
        makeFindOneMock({
          _id: validObjectId,
          title: 'Test Event',
          status: EventStatus.PENDING,
        }),
      );

      const result = await service.approveItem(validObjectId, 'admin_1');

      expect(mockEventService.approveEvent).toHaveBeenCalledWith(validObjectId);
      expect(result.success).toBe(true);
      expect(result.type).toBe('event');
    });

    it('should throw BadRequestException when event is not pending', async () => {
      mockPostModel.findById.mockReturnValue(makeFindOneMock(null));
      mockEventModel.findById.mockReturnValue(
        makeFindOneMock({
          _id: validObjectId,
          title: 'Test Event',
          status: EventStatus.APPROVED,
        }),
      );

      await expect(
        service.approveItem(validObjectId, 'admin_1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should approve a candidate lead nomination when found', async () => {
      mockPostModel.findById.mockReturnValue(makeFindOneMock(null));
      mockEventModel.findById.mockReturnValue(makeFindOneMock(null));
      mockLeadCandidateModel.findById.mockReturnValue(
        makeFindOneMock({ _id: validObjectId }),
      );

      const result = await service.approveItem(validObjectId, 'admin_1');

      expect(mockCandidateService.approveCandidate).toHaveBeenCalledWith(
        validObjectId,
        'admin_1',
      );
      expect(result.success).toBe(true);
      expect(result.type).toBe('lead');
    });

    it('should approve a user lead application when found', async () => {
      mockPostModel.findById.mockReturnValue(makeFindOneMock(null));
      mockEventModel.findById.mockReturnValue(makeFindOneMock(null));
      mockLeadCandidateModel.findById.mockReturnValue(makeFindOneMock(null));
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: validObjectId,
          email: 'lead@test.com',
          applicationStatus: ApplicationStatus.PENDING,
        }),
      });

      const result = await service.approveItem(validObjectId, 'admin_1');

      expect(mockUsersService.approveTempApplication).toHaveBeenCalledWith(
        'lead@test.com',
      );
      expect(result.success).toBe(true);
      expect(result.type).toBe('lead');
    });

    it('should throw NotFoundException when item does not exist', async () => {
      mockPostModel.findById.mockReturnValue(makeFindOneMock(null));
      mockEventModel.findById.mockReturnValue(makeFindOneMock(null));
      mockLeadCandidateModel.findById.mockReturnValue(makeFindOneMock(null));
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.approveItem(validObjectId, 'admin_1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('rejectItem', () => {
    it('should soft delete a blog when found', async () => {
      mockPostModel.findById.mockReturnValue(
        makeFindOneMock({
          _id: validObjectId,
          title: 'Test Post',
          status: PostStatus.PENDING,
        }),
      );

      const result = await service.rejectItem(
        validObjectId,
        'admin_1',
        mockAdminReq,
      );

      expect(mockPostService.softDeletePost).toHaveBeenCalledWith(
        validObjectId,
      );
      expect(result.success).toBe(true);
      expect(result.type).toBe('blog');
    });

    it('should throw BadRequestException when blog is not pending', async () => {
      mockPostModel.findById.mockReturnValue(
        makeFindOneMock({
          _id: validObjectId,
          title: 'Test Post',
          status: PostStatus.APPROVED,
        }),
      );

      await expect(
        service.rejectItem(validObjectId, 'admin_1', mockAdminReq),
      ).rejects.toThrow(BadRequestException);
    });

    it('should soft delete an event when found', async () => {
      mockPostModel.findById.mockReturnValue(makeFindOneMock(null));
      mockEventModel.findById.mockReturnValue(
        makeFindOneMock({
          _id: validObjectId,
          title: 'Test Event',
          status: EventStatus.PENDING,
        }),
      );

      const result = await service.rejectItem(
        validObjectId,
        'admin_1',
        mockAdminReq,
      );

      expect(mockEventService.softDeleteEvent).toHaveBeenCalledWith(
        validObjectId,
        mockAdminReq,
      );
      expect(result.success).toBe(true);
      expect(result.type).toBe('event');
    });

    it('should throw BadRequestException when event is not pending', async () => {
      mockPostModel.findById.mockReturnValue(makeFindOneMock(null));
      mockEventModel.findById.mockReturnValue(
        makeFindOneMock({
          _id: validObjectId,
          title: 'Test Event',
          status: EventStatus.APPROVED,
        }),
      );

      await expect(
        service.rejectItem(validObjectId, 'admin_1', mockAdminReq),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject a candidate lead nomination when found', async () => {
      mockPostModel.findById.mockReturnValue(makeFindOneMock(null));
      mockEventModel.findById.mockReturnValue(makeFindOneMock(null));
      mockLeadCandidateModel.findById.mockReturnValue(
        makeFindOneMock({ _id: validObjectId }),
      );

      const result = await service.rejectItem(
        validObjectId,
        'admin_1',
        mockAdminReq,
        {
          reason: 'Not qualified',
        },
      );

      expect(mockCandidateService.rejectCandidate).toHaveBeenCalledWith(
        validObjectId,
        'admin_1',
        'Not qualified',
      );
      expect(result.success).toBe(true);
      expect(result.type).toBe('lead');
    });

    it('should reject a user lead application when found', async () => {
      mockPostModel.findById.mockReturnValue(makeFindOneMock(null));
      mockEventModel.findById.mockReturnValue(makeFindOneMock(null));
      mockLeadCandidateModel.findById.mockReturnValue(makeFindOneMock(null));
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: validObjectId,
          email: 'lead@test.com',
          applicationStatus: ApplicationStatus.PENDING,
        }),
      });

      const result = await service.rejectItem(
        validObjectId,
        'admin_1',
        mockAdminReq,
      );

      expect(mockUsersService.rejectTempApplication).toHaveBeenCalledWith(
        'lead@test.com',
        'Application/submission rejected by administrator',
      );
      expect(result.success).toBe(true);
      expect(result.type).toBe('lead');
    });

    it('should throw NotFoundException when item does not exist', async () => {
      mockPostModel.findById.mockReturnValue(makeFindOneMock(null));
      mockEventModel.findById.mockReturnValue(makeFindOneMock(null));
      mockLeadCandidateModel.findById.mockReturnValue(makeFindOneMock(null));
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.rejectItem(validObjectId, 'admin_1', mockAdminReq),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
