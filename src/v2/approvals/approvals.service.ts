import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Model, isValidObjectId, Types } from 'mongoose';
import { format } from 'date-fns';
import { Status as EventStatus } from 'src/shared/interfaces/event.type';
import { Status as PostStatus } from 'src/shared/interfaces/post.type';
import { ApplicationStatus } from 'src/shared/interfaces/user.type';
import { ApiReq } from 'src/shared/interfaces';
import {
  Event,
  EventDocument,
  LeadCandidate,
  LeadCandidateDocument,
  Post,
  PostDocument,
  User,
  UserDocument,
} from 'src/shared/schema';
import { PostService } from 'src/blog/post/post.service';
import { EventService } from 'src/events/events.users.service';
import { UsersService } from 'src/users/users.service';
import { CandidateService } from 'src/users/leads/services/candidate.service';
import {
  ApprovalItemDto,
  ApprovalItemType,
  PendingApprovalsQueryDto,
  PendingApprovalsResponseDto,
} from './dto/pending-approvals.dto';
import {
  ApprovalActionResultDto,
  ApproveApprovalDto,
  RejectApprovalDto,
} from './dto/approval-action.dto';

@Injectable()
export class ApprovalsService {
  private readonly logger = new Logger(ApprovalsService.name);

  constructor(
    @Inject(Post.name)
    private readonly postModel: Model<PostDocument>,
    @Inject(Event.name)
    private readonly eventModel: Model<EventDocument>,
    @Inject(User.name)
    private readonly userModel: Model<UserDocument>,
    @Inject(LeadCandidate.name)
    private readonly leadCandidateModel: Model<LeadCandidateDocument>,
    private readonly postService: PostService,
    private readonly eventService: EventService,
    private readonly usersService: UsersService,
    private readonly candidateService: CandidateService,
  ) {}

  private calculateReadTime(text: string): string {
    if (!text) return '1 min read';
    const wordsPerMinute = 200;
    const wordCount = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  }

  private async getPendingBlogs(): Promise<ApprovalItemDto[]> {
    try {
      const blogs = await this.postModel
        .find({ status: PostStatus.PENDING })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      return blogs.map((blog: any) => {
        const fullContent = `${blog.shortDesc || ''} ${blog.description || ''}`;
        return {
          id: blog._id?.toString() || '',
          type: 'blog',
          title: blog.title || '',
          thumbnail_url: blog.photo || undefined,
          author: {
            name: blog.authorName || 'Author',
            role: blog.authorRole || 'Contributor',
            avatar_url: blog.authorAvatar || undefined,
          },
          metadata: {
            read_time: this.calculateReadTime(fullContent),
          },
          created_at: blog.createdAt ? new Date(blog.createdAt).toISOString() : new Date().toISOString(),
        };
      });
    } catch (error) {
      this.logger.error(`Error retrieving pending blogs: ${(error as Error).message}`);
      return [];
    }
  }

  private async getPendingEvents(): Promise<ApprovalItemDto[]> {
    try {
      const events = await this.eventModel
        .find({ status: EventStatus.PENDING })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      return events.map((event: any) => {
        const eventDateObj = event.eventDate ? new Date(event.eventDate) : null;
        let formattedDate = '';
        let formattedTime = '';

        if (eventDateObj && !isNaN(eventDateObj.getTime())) {
          try {
            formattedDate = format(eventDateObj, 'MMMM d, yyyy');
            formattedTime = format(eventDateObj, 'ha').toLowerCase();
          } catch {
            formattedDate = eventDateObj.toDateString();
            formattedTime = eventDateObj.toTimeString();
          }
        }

        return {
          id: event._id?.toString() || '',
          type: 'event',
          title: event.title || '',
          thumbnail_url: event.photo || undefined,
          organizer: {
            name: event.host || 'Event Organizer',
            platform: event.joinMethod || (event.location === 'ONLINE' ? 'Online' : 'Physical'),
            avatar_url: event.photo || undefined,
          },
          metadata: {
            date: formattedDate,
            time: formattedTime,
          },
          created_at: event.createdAt ? new Date(event.createdAt).toISOString() : new Date().toISOString(),
        };
      });
    } catch (error) {
      this.logger.error(`Error retrieving pending events: ${(error as Error).message}`);
      return [];
    }
  }

  private async getPendingLeads(): Promise<ApprovalItemDto[]> {
    try {
      const leads = await this.userModel
        .find({ applicationStatus: ApplicationStatus.PENDING })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      return leads.map((lead: any) => {
        const firstName = lead.basicInfo?.firstName || '';
        const lastName = lead.basicInfo?.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim() || lead.userHandle || lead.email;

        return {
          id: lead._id?.toString() || '',
          type: 'lead',
          title: fullName,
          role: lead.leadPosition || lead.professionalInfo?.position || 'Applicant',
          email: lead.email || '',
          avatar_url: lead.photo || undefined,
          created_at: lead.createdAt ? new Date(lead.createdAt).toISOString() : new Date().toISOString(),
        };
      });
    } catch (error) {
      this.logger.error(`Error retrieving pending leads: ${(error as Error).message}`);
      return [];
    }
  }

  async getPendingApprovals(query: PendingApprovalsQueryDto): Promise<PendingApprovalsResponseDto> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const type = query.type || ApprovalItemType.ALL;

    let items: ApprovalItemDto[] = [];

    if (type === ApprovalItemType.BLOG) {
      items = await this.getPendingBlogs();
    } else if (type === ApprovalItemType.EVENT) {
      items = await this.getPendingEvents();
    } else if (type === ApprovalItemType.LEAD) {
      items = await this.getPendingLeads();
    } else {
      const [blogs, events, leads] = await Promise.all([
        this.getPendingBlogs(),
        this.getPendingEvents(),
        this.getPendingLeads(),
      ]);
      items = [...blogs, ...events, ...leads];
    }

    // Sort descending by created_at
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = items.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    return {
      page,
      limit,
      total,
      items: paginatedItems,
    };
  }

  async approveItem(
    id: string,
    adminId: string,
    dto?: ApproveApprovalDto,
  ): Promise<ApprovalActionResultDto> {
    if (!id) {
      throw new BadRequestException('ID is required');
    }

    const explicitType = dto?.type;

    // 1. If type is blog or not specified, check Post
    if (!explicitType || explicitType === ApprovalItemType.BLOG) {
      if (isValidObjectId(id)) {
        const post = await this.postModel.findById(id).lean().exec();
        if (post) {
          await this.postService.approvePost(id);
          return {
            success: true,
            message: `Blog "${post.title || id}" approved successfully`,
            id,
            type: 'blog',
          };
        }
      }
      if (explicitType === ApprovalItemType.BLOG) {
        throw new NotFoundException(`Blog with ID ${id} not found`);
      }
    }

    // 2. If type is event or not specified, check Event
    if (!explicitType || explicitType === ApprovalItemType.EVENT) {
      if (isValidObjectId(id)) {
        const event = await this.eventModel.findById(id).lean().exec();
        if (event) {
          await this.eventService.approveEvent(id);
          return {
            success: true,
            message: `Event "${event.title || id}" approved successfully`,
            id,
            type: 'event',
          };
        }
      }
      if (explicitType === ApprovalItemType.EVENT) {
        throw new NotFoundException(`Event with ID ${id} not found`);
      }
    }

    // 3. If type is lead or not specified, check LeadCandidate and User
    if (!explicitType || explicitType === ApprovalItemType.LEAD) {
      if (isValidObjectId(id)) {
        // Check LeadCandidate nomination
        const candidate = await this.leadCandidateModel.findById(id).lean().exec();
        if (candidate) {
          await this.candidateService.approveCandidate(id, adminId);
          return {
            success: true,
            message: `Lead nomination ${id} approved successfully`,
            id,
            type: 'lead',
          };
        }

        // Check User direct application
        const user = await this.userModel.findById(id).exec();
        if (user && user.applicationStatus === ApplicationStatus.PENDING) {
          const msg = await this.usersService.approveTempApplication(user.email);
          return {
            success: true,
            message: msg || `Lead application for ${user.email} approved successfully`,
            id,
            type: 'lead',
          };
        }
      }
      if (explicitType === ApprovalItemType.LEAD) {
        throw new NotFoundException(`Lead application with ID ${id} not found`);
      }
    }

    throw new NotFoundException(`Pending approval item with ID ${id} not found`);
  }

  async rejectItem(
    id: string,
    adminId: string,
    req: ApiReq,
    dto?: RejectApprovalDto,
  ): Promise<ApprovalActionResultDto> {
    if (!id) {
      throw new BadRequestException('ID is required');
    }

    const explicitType = dto?.type;
    const reason = dto?.reason || 'Application/submission rejected by administrator';

    // 1. If type is blog or not specified, check Post
    if (!explicitType || explicitType === ApprovalItemType.BLOG) {
      if (isValidObjectId(id)) {
        const post = await this.postModel.findById(id).lean().exec();
        if (post) {
          await this.postService.softDeletePost(id);
          return {
            success: true,
            message: `Blog "${post.title || id}" removed successfully`,
            id,
            type: 'blog',
          };
        }
      }
      if (explicitType === ApprovalItemType.BLOG) {
        throw new NotFoundException(`Blog with ID ${id} not found`);
      }
    }

    // 2. If type is event or not specified, check Event
    if (!explicitType || explicitType === ApprovalItemType.EVENT) {
      if (isValidObjectId(id)) {
        const event = await this.eventModel.findById(id).lean().exec();
        if (event) {
          await this.eventService.softDeleteEvent(id, req);
          return {
            success: true,
            message: `Event "${event.title || id}" removed successfully`,
            id,
            type: 'event',
          };
        }
      }
      if (explicitType === ApprovalItemType.EVENT) {
        throw new NotFoundException(`Event with ID ${id} not found`);
      }
    }

    // 3. If type is lead or not specified, check LeadCandidate and User
    if (!explicitType || explicitType === ApprovalItemType.LEAD) {
      if (isValidObjectId(id)) {
        // Check LeadCandidate nomination
        const candidate = await this.leadCandidateModel.findById(id).lean().exec();
        if (candidate) {
          await this.candidateService.rejectCandidate(id, adminId, reason);
          return {
            success: true,
            message: `Lead nomination ${id} rejected successfully`,
            id,
            type: 'lead',
          };
        }

        // Check User direct application
        const user = await this.userModel.findById(id).exec();
        if (user && user.applicationStatus === ApplicationStatus.PENDING) {
          const msg = await this.usersService.rejectTempApplication(user.email, reason);
          return {
            success: true,
            message: msg || `Lead application for ${user.email} rejected successfully`,
            id,
            type: 'lead',
          };
        }
      }
      if (explicitType === ApprovalItemType.LEAD) {
        throw new NotFoundException(`Lead application with ID ${id} not found`);
      }
    }

    throw new NotFoundException(`Pending approval item with ID ${id} not found`);
  }
}

