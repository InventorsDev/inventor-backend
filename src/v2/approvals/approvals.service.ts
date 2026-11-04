import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Model, isValidObjectId } from 'mongoose';
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
  LeadCandidateStatus,
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

  private readonly pendingBlogsFilter = { status: PostStatus.PENDING };
  private readonly pendingEventsFilter = { status: EventStatus.PENDING };
  private readonly pendingUsersFilter = {
    applicationStatus: ApplicationStatus.PENDING,
  };
  private readonly pendingCandidatesFilter = {
    status: {
      $in: [LeadCandidateStatus.PENDING, LeadCandidateStatus.INVITED],
    },
  };

  private sortByNewest(items: ApprovalItemDto[]): ApprovalItemDto[] {
    return items.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  // Each getPending* method returns at most `take` of the newest items, so a
  // page can be built without loading every pending document into memory.
  private async getPendingBlogs(take: number): Promise<ApprovalItemDto[]> {
    try {
      const blogs = await this.postModel
        .find(this.pendingBlogsFilter)
        .select('title photo shortDesc description createdAt')
        .sort({ createdAt: -1 })
        .limit(take)
        .lean()
        .exec();

      return blogs.map((blog: any) => {
        const fullContent = `${blog.shortDesc || ''} ${blog.description || ''}`;
        return {
          id: blog._id?.toString() || '',
          type: 'blog',
          title: blog.title || '',
          thumbnail_url: blog.photo || undefined,
          metadata: {
            shortDesc: blog.shortDesc || '',
            read_time: this.calculateReadTime(fullContent),
          },
          created_at: blog.createdAt
            ? new Date(blog.createdAt).toISOString()
            : new Date().toISOString(),
        };
      });
    } catch (error) {
      this.logger.error(
        `Error retrieving pending blogs: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve pending blogs',
      );
    }
  }

  private async getPendingEvents(take: number): Promise<ApprovalItemDto[]> {
    try {
      const events = await this.eventModel
        .find(this.pendingEventsFilter)
        .select('title photo host joinMethod location eventDate createdAt')
        .sort({ createdAt: -1 })
        .limit(take)
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
            platform:
              event.joinMethod ||
              (event.location === 'ONLINE' ? 'Online' : 'Physical'),
            avatar_url: event.photo || undefined,
          },
          metadata: {
            date: formattedDate,
            time: formattedTime,
          },
          created_at: event.createdAt
            ? new Date(event.createdAt).toISOString()
            : new Date().toISOString(),
        };
      });
    } catch (error) {
      this.logger.error(
        `Error retrieving pending events: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve pending events',
      );
    }
  }

  private async getPendingLeads(take: number): Promise<ApprovalItemDto[]> {
    try {
      const [users, candidates] = await Promise.all([
        this.userModel
          .find(this.pendingUsersFilter)
          .select(
            'basicInfo userHandle email leadPosition professionalInfo photo createdAt',
          )
          .sort({ createdAt: -1 })
          .limit(take)
          .lean()
          .exec(),
        this.leadCandidateModel
          .find(this.pendingCandidatesFilter)
          .select('email userId recommendedFor createdAt')
          .sort({ createdAt: -1 })
          .limit(take)
          .lean()
          .exec(),
      ]);

      const userItems: ApprovalItemDto[] = users.map((lead: any) => {
        const firstName = lead.basicInfo?.firstName || '';
        const lastName = lead.basicInfo?.lastName || '';
        const fullName =
          `${firstName} ${lastName}`.trim() || lead.userHandle || lead.email;

        return {
          id: lead._id?.toString() || '',
          type: 'lead',
          title: fullName,
          role:
            lead.leadPosition || lead.professionalInfo?.position || 'Applicant',
          email: lead.email || '',
          avatar_url: lead.photo || undefined,
          created_at: lead.createdAt
            ? new Date(lead.createdAt).toISOString()
            : new Date().toISOString(),
        };
      });

      // Nominees who already have an account are shown by their name.
      const nomineeIds = candidates
        .map((c: any) => c.userId)
        .filter((id) => !!id);
      const nominees = nomineeIds.length
        ? await this.userModel
            .find({ _id: { $in: nomineeIds } })
            .select('basicInfo userHandle photo')
            .lean()
            .exec()
        : [];
      const nomineesById = new Map(
        nominees.map((u: any) => [u._id.toString(), u]),
      );

      const candidateItems: ApprovalItemDto[] = candidates.map((c: any) => {
        const nominee: any = c.userId
          ? nomineesById.get(c.userId.toString())
          : undefined;
        const nomineeName = [
          nominee?.basicInfo?.firstName,
          nominee?.basicInfo?.lastName,
        ]
          .filter(Boolean)
          .join(' ');

        return {
          id: c._id?.toString() || '',
          type: 'lead',
          title: nomineeName || nominee?.userHandle || c.email || 'Nominee',
          role: c.recommendedFor || 'Nominee',
          email: c.email || '',
          avatar_url: nominee?.photo || undefined,
          created_at: c.createdAt
            ? new Date(c.createdAt).toISOString()
            : new Date().toISOString(),
        };
      });

      return this.sortByNewest([...userItems, ...candidateItems]).slice(
        0,
        take,
      );
    } catch (error) {
      this.logger.error(
        `Error retrieving pending leads: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve pending leads',
      );
    }
  }

  private async countPending(type: ApprovalItemType): Promise<number> {
    const includes = (itemType: ApprovalItemType) =>
      type === ApprovalItemType.ALL || type === itemType;

    try {
      const counts = await Promise.all([
        includes(ApprovalItemType.BLOG)
          ? this.postModel.countDocuments(this.pendingBlogsFilter).exec()
          : 0,
        includes(ApprovalItemType.EVENT)
          ? this.eventModel.countDocuments(this.pendingEventsFilter).exec()
          : 0,
        includes(ApprovalItemType.LEAD)
          ? this.userModel.countDocuments(this.pendingUsersFilter).exec()
          : 0,
        includes(ApprovalItemType.LEAD)
          ? this.leadCandidateModel
              .countDocuments(this.pendingCandidatesFilter)
              .exec()
          : 0,
      ]);
      return counts.reduce((sum, count) => sum + count, 0);
    } catch (error) {
      this.logger.error(
        `Error counting pending approvals: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        'Failed to count pending approvals',
      );
    }
  }

  private async getItemsForType(
    type: ApprovalItemType,
    take: number,
  ): Promise<ApprovalItemDto[]> {
    if (type === ApprovalItemType.BLOG) {
      return this.getPendingBlogs(take);
    }
    if (type === ApprovalItemType.EVENT) {
      return this.getPendingEvents(take);
    }
    if (type === ApprovalItemType.LEAD) {
      return this.getPendingLeads(take);
    }

    const [blogs, events, leads] = await Promise.all([
      this.getPendingBlogs(take),
      this.getPendingEvents(take),
      this.getPendingLeads(take),
    ]);
    return this.sortByNewest([...blogs, ...events, ...leads]);
  }

  async getPendingApprovals(
    query: PendingApprovalsQueryDto,
  ): Promise<PendingApprovalsResponseDto> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const type = query.type || ApprovalItemType.ALL;

    // The newest `page * limit` items of the merged list can only come from
    // the newest `page * limit` items of each source.
    const startIndex = (page - 1) * limit;
    const take = startIndex + limit;

    const [items, total] = await Promise.all([
      this.getItemsForType(type, take),
      this.countPending(type),
    ]);

    return {
      page,
      limit,
      total,
      items: items.slice(startIndex, take),
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
          if (post.status !== PostStatus.PENDING) {
            throw new BadRequestException(
              `Blog is not pending approval (current status: ${post.status})`,
            );
          }
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
          if (event.status !== EventStatus.PENDING) {
            throw new BadRequestException(
              `Event is not pending approval (current status: ${event.status})`,
            );
          }
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
        const candidate = await this.leadCandidateModel
          .findById(id)
          .lean()
          .exec();
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
          const msg = await this.usersService.approveTempApplication(
            user.email,
          );
          return {
            success: true,
            message:
              msg || `Lead application for ${user.email} approved successfully`,
            id,
            type: 'lead',
          };
        }
      }
      if (explicitType === ApprovalItemType.LEAD) {
        throw new NotFoundException(`Lead application with ID ${id} not found`);
      }
    }

    throw new NotFoundException(
      `Pending approval item with ID ${id} not found`,
    );
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
    const reason =
      dto?.reason || 'Application/submission rejected by administrator';

    // 1. If type is blog or not specified, check Post
    if (!explicitType || explicitType === ApprovalItemType.BLOG) {
      if (isValidObjectId(id)) {
        const post = await this.postModel.findById(id).lean().exec();
        if (post) {
          if (post.status !== PostStatus.PENDING) {
            throw new BadRequestException(
              `Blog is not pending approval (current status: ${post.status})`,
            );
          }
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
          if (event.status !== EventStatus.PENDING) {
            throw new BadRequestException(
              `Event is not pending approval (current status: ${event.status})`,
            );
          }
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
        const candidate = await this.leadCandidateModel
          .findById(id)
          .lean()
          .exec();
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
          const msg = await this.usersService.rejectTempApplication(
            user.email,
            reason,
          );
          return {
            success: true,
            message:
              msg || `Lead application for ${user.email} rejected successfully`,
            id,
            type: 'lead',
          };
        }
      }
      if (explicitType === ApprovalItemType.LEAD) {
        throw new NotFoundException(`Lead application with ID ${id} not found`);
      }
    }

    throw new NotFoundException(
      `Pending approval item with ID ${id} not found`,
    );
  }
}
