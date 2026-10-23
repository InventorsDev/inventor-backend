import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { PostService } from 'src/blog/post/post.service';
import { EventService } from 'src/events/events.users.service';
import { ApiReq } from 'src/shared/interfaces';
import { ApplicationStatus } from 'src/shared/interfaces/user.type';
import { Event, LeadCandidate, Post, User } from 'src/shared/schema';
import { CandidateService } from 'src/users/leads/services/candidate.service';
import { UsersService } from 'src/users/users.service';
import { ApprovalsService } from './approvals.service';
import { ApprovalItemType } from './dto/pending-approvals.dto';

const makeQueryMock = (records: any[]) => ({
  sort: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(records),
});

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

  describe('approveItem', () => {
    it('should approve a blog when found', async () => {
      mockPostModel.findById.mockReturnValue(makeFindOneMock({ _id: validObjectId, title: 'Test Post' }));

      const result = await service.approveItem(validObjectId, 'admin_1');

      expect(mockPostService.approvePost).toHaveBeenCalledWith(validObjectId);
      expect(result.success).toBe(true);
      expect(result.type).toBe('blog');
    });

    it('should approve an event when blog is not found', async () => {
      mockPostModel.findById.mockReturnValue(makeFindOneMock(null));
      mockEventModel.findById.mockReturnValue(makeFindOneMock({ _id: validObjectId, title: 'Test Event' }));

      const result = await service.approveItem(validObjectId, 'admin_1');

      expect(mockEventService.approveEvent).toHaveBeenCalledWith(validObjectId);
      expect(result.success).toBe(true);
      expect(result.type).toBe('event');
    });

    it('should approve a candidate lead nomination when found', async () => {
      mockPostModel.findById.mockReturnValue(makeFindOneMock(null));
      mockEventModel.findById.mockReturnValue(makeFindOneMock(null));
      mockLeadCandidateModel.findById.mockReturnValue(makeFindOneMock({ _id: validObjectId }));

      const result = await service.approveItem(validObjectId, 'admin_1');

      expect(mockCandidateService.approveCandidate).toHaveBeenCalledWith(validObjectId, 'admin_1');
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

      expect(mockUsersService.approveTempApplication).toHaveBeenCalledWith('lead@test.com');
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

      await expect(service.approveItem(validObjectId, 'admin_1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('rejectItem', () => {
    it('should soft delete a blog when found', async () => {
      mockPostModel.findById.mockReturnValue(makeFindOneMock({ _id: validObjectId, title: 'Test Post' }));

      const result = await service.rejectItem(validObjectId, 'admin_1', mockAdminReq);

      expect(mockPostService.softDeletePost).toHaveBeenCalledWith(validObjectId);
      expect(result.success).toBe(true);
      expect(result.type).toBe('blog');
    });

    it('should soft delete an event when found', async () => {
      mockPostModel.findById.mockReturnValue(makeFindOneMock(null));
      mockEventModel.findById.mockReturnValue(makeFindOneMock({ _id: validObjectId, title: 'Test Event' }));

      const result = await service.rejectItem(validObjectId, 'admin_1', mockAdminReq);

      expect(mockEventService.softDeleteEvent).toHaveBeenCalledWith(validObjectId, mockAdminReq);
      expect(result.success).toBe(true);
      expect(result.type).toBe('event');
    });

    it('should reject a candidate lead nomination when found', async () => {
      mockPostModel.findById.mockReturnValue(makeFindOneMock(null));
      mockEventModel.findById.mockReturnValue(makeFindOneMock(null));
      mockLeadCandidateModel.findById.mockReturnValue(makeFindOneMock({ _id: validObjectId }));

      const result = await service.rejectItem(validObjectId, 'admin_1', mockAdminReq, {
        reason: 'Not qualified',
      });

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

      const result = await service.rejectItem(validObjectId, 'admin_1', mockAdminReq);

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
