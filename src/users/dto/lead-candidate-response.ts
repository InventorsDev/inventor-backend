import type {
  LeadAssignmentPositions,
  LeadCandidateStatus,
} from 'src/shared/schema';

export interface CandidateResponse {
  id: string;
  email?: string;
  userId?: string;

  status: LeadCandidateStatus;
  recommendedFor: LeadAssignmentPositions;
}
