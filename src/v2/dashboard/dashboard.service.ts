import { Inject, Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { Status as EventStatus } from 'src/shared/interfaces/event.type';
import { Status as PostStatus } from 'src/shared/interfaces/post.type';
import { ApplicationStatus, UserRole, UserStatus } from 'src/shared/interfaces/user.type';
import {
  Event,
  EventDocument,
  LeadCandidate,
  LeadCandidateDocument,
  LeadCandidateStatus,
  LeadInvitation,
  LeadInvitationDocument,
  LeadInvitationStatus,
  Post,
  PostDocument,
  User,
  UserDocument,
} from 'src/shared/schema';
import { DashboardStatsResponseDto } from './dto/dashboard-stats.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @Inject(User.name)
    private readonly userModel: Model<UserDocument>,
    @Inject(Event.name)
    private readonly eventModel: Model<EventDocument>,
    @Inject(Post.name)
    private readonly postModel: Model<PostDocument>,
    @Inject(LeadCandidate.name)
    private readonly leadCandidateModel: Model<LeadCandidateDocument>,
    @Inject(LeadInvitation.name)
    private readonly leadInvitationModel: Model<LeadInvitationDocument>,
  ) {}

  private async safeCount(
    operationName: string,
    countFn: () => Promise<number>,
  ): Promise<number> {
    try {
      return await countFn();
    } catch (error) {
      this.logger.error(
        `Failed to retrieve count for ${operationName}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return 0;
    }
  }

  async getDashboardStats(): Promise<DashboardStatsResponseDto> {
    const now = new Date();

    const [
      leadsTotal,
      leadsDeactivated,
      directPendingApplications,
      candidatePendingRecommendations,
      invitationPending,
      eventsUpcoming,
      eventsPending,
      blogsPublished,
      blogsPending,
    ] = await Promise.all([
      // Total leads: user role includes LEAD and status is not DEACTIVATED or DISABLE
      this.safeCount('leadsTotal', () =>
        this.userModel.countDocuments({
          role: UserRole.LEAD,
          status: { $nin: [UserStatus.DEACTIVATED, UserStatus.DISABLE] },
        }).exec(),
      ),

      // Deactivated leads
      this.safeCount('leadsDeactivated', () =>
        this.userModel.countDocuments({
          role: UserRole.LEAD,
          status: UserStatus.DEACTIVATED,
        }).exec(),
      ),

      // Direct pending lead applications on users collection
      this.safeCount('directPendingApplications', () =>
        this.userModel.countDocuments({
          applicationStatus: ApplicationStatus.PENDING,
        }).exec(),
      ),

      // Pending candidate recommendations
      this.safeCount('candidatePendingRecommendations', () =>
        this.leadCandidateModel.countDocuments({
          status: LeadCandidateStatus.PENDING,
        }).exec(),
      ),

      // Pending lead invitations
      this.safeCount('invitationPending', () =>
        this.leadInvitationModel.countDocuments({
          status: LeadInvitationStatus.PENDING,
        }).exec(),
      ),

      // Upcoming approved events
      this.safeCount('eventsUpcoming', () =>
        this.eventModel.countDocuments({
          status: EventStatus.APPROVED,
          eventDate: { $gte: now },
        }).exec(),
      ),

      // Pending events
      this.safeCount('eventsPending', () =>
        this.eventModel.countDocuments({
          status: EventStatus.PENDING,
        }).exec(),
      ),

      // Published/approved posts
      this.safeCount('blogsPublished', () =>
        this.postModel.countDocuments({
          status: PostStatus.APPROVED,
        }).exec(),
      ),

      // Pending posts
      this.safeCount('blogsPending', () =>
        this.postModel.countDocuments({
          status: PostStatus.PENDING,
        }).exec(),
      ),
    ]);

    const totalPendingLeads =
      directPendingApplications +
      candidatePendingRecommendations +
      invitationPending;

    return {
      leads: {
        total: leadsTotal,
        pending: totalPendingLeads,
      },
      events: {
        upcoming: eventsUpcoming,
        pending: eventsPending,
      },
      blogs: {
        published: blogsPublished,
        pending: blogsPending,
      },
      deactivated: {
        total: leadsDeactivated,
      },
    };
  }
}

