import { randomUUID, type UUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import {
  LeadAssignmentPositions,
  LeadCandidateStatus,
  type LeadCandidate,
} from 'src/shared/schema';
import { CandidateService } from './candidate.service';
import mongoose, { Mongoose } from 'mongoose';

describe('LeadCandidateService', () => {
  let service: CandidateService;
  let leadCandidateRepo: {
    find: jest.Mock;
  };

  beforeEach(() => {
    leadCandidateRepo = {
      find: jest.fn(),
    };

    service = new CandidateService(leadCandidateRepo as any);
  });

  describe('getAllSessionCandidates', () => {
    it('should return all candidates for a session', async () => {
      const sessionId = new mongoose.Types.ObjectId();

      const candidates: LeadCandidate[] = [
        {
          email: 'candidate1@example.com',
          userId: new mongoose.Types.ObjectId(),
          sessionId,
          status: LeadCandidateStatus.INVITED,
          recommendedBy: new mongoose.Types.ObjectId(),
          recommendedAt: new Date(),
          recommendedFor: LeadAssignmentPositions.BACKEND,
          invitedAt: new Date(),
        },
        {
          email: 'candidate2@example.com',
          userId: new mongoose.Types.ObjectId(),
          sessionId,
          status: LeadCandidateStatus.PENDING,
          recommendedBy: new mongoose.Types.ObjectId(),
          recommendedAt: new Date(),
          recommendedFor: LeadAssignmentPositions.FRONTEND,
          invitedAt: new Date(),
          acceptedAt: new Date(),
        },
      ];
      leadCandidateRepo.find.mockResolvedValue(candidates);

      const result = await service.getAllSessionCandidates(
        new mongoose.Types.ObjectId(sessionId),
      );

      expect(leadCandidateRepo.find).toHaveBeenCalledWith({
        sessionId,
      });

      expect(result).toEqual(candidates);
    });

    it('should return an empty array when no candidates exist', async () => {
      const sessionId = new mongoose.Types.ObjectId('68ac9876543210abcdef5678');

      leadCandidateRepo.find.mockResolvedValue([]);

      const result = await service.getAllSessionCandidates(sessionId);

      expect(result).toEqual([]);
      expect(leadCandidateRepo.find).toHaveBeenCalledWith({
        sessionId,
      });
    });
  });

  describe('getNoOfCandidatesForRole', () => {
    it('should throw BadRequestException for an invalid role', async () => {
      const sessId = new mongoose.Types.ObjectId().toString();

      await expect(
        service.getNoOfCandidatesForRole('not-a-real-role', sessId),
      ).rejects.toThrow(BadRequestException);

      expect(leadCandidateRepo.find).not.toHaveBeenCalled();
    });

    it('should return the count of candidates matching the given role', async () => {
      const sessionId = new mongoose.Types.ObjectId();
      const sessId = sessionId.toString();

      const candidates: LeadCandidate[] = [
        {
          email: 'candidate1@example.com',
          userId: new mongoose.Types.ObjectId(),
          sessionId,
          status: LeadCandidateStatus.INVITED,
          recommendedBy: new mongoose.Types.ObjectId(),
          recommendedAt: new Date(),
          recommendedFor: LeadAssignmentPositions.BACKEND,
          invitedAt: new Date(),
        },
        {
          email: 'candidate2@example.com',
          userId: new mongoose.Types.ObjectId(),
          sessionId,
          status: LeadCandidateStatus.PENDING,
          recommendedBy: new mongoose.Types.ObjectId(),
          recommendedAt: new Date(),
          recommendedFor: LeadAssignmentPositions.FRONTEND,
          invitedAt: new Date(),
          acceptedAt: new Date(),
        },
        {
          email: 'candidate3@example.com',
          userId: new mongoose.Types.ObjectId(),
          sessionId,
          status: LeadCandidateStatus.INVITED,
          recommendedBy: new mongoose.Types.ObjectId(),
          recommendedAt: new Date(),
          recommendedFor: LeadAssignmentPositions.BACKEND,
          invitedAt: new Date(),
        },
      ];
      leadCandidateRepo.find.mockResolvedValue(candidates);

      const result = await service.getNoOfCandidatesForRole(
        LeadAssignmentPositions.BACKEND,
        sessId,
      );

      expect(result).toBe(2);
      expect(leadCandidateRepo.find).toHaveBeenCalledWith({
        sessionId: expect.any(mongoose.Types.ObjectId),
      });
    });

    it('should return 0 when no candidates match the given role', async () => {
      const sessionId = new mongoose.Types.ObjectId();
      const sessId = sessionId.toString();

      const candidates: LeadCandidate[] = [
        {
          email: 'candidate1@example.com',
          userId: new mongoose.Types.ObjectId(),
          sessionId,
          status: LeadCandidateStatus.INVITED,
          recommendedBy: new mongoose.Types.ObjectId(),
          recommendedAt: new Date(),
          recommendedFor: LeadAssignmentPositions.FRONTEND,
          invitedAt: new Date(),
        },
      ];
      leadCandidateRepo.find.mockResolvedValue(candidates);

      const result = await service.getNoOfCandidatesForRole(
        LeadAssignmentPositions.BACKEND,
        sessId,
      );

      expect(result).toBe(0);
    });
  });

  describe('isExistingCandidates', () => {
    it('should return true when a candidate with the given email exists in the session', async () => {
      const sessionId = new mongoose.Types.ObjectId();
      const sessId = sessionId.toString();

      const candidates: LeadCandidate[] = [
        {
          email: 'candidate1@example.com',
          userId: new mongoose.Types.ObjectId(),
          sessionId,
          status: LeadCandidateStatus.INVITED,
          recommendedBy: new mongoose.Types.ObjectId(),
          recommendedAt: new Date(),
          recommendedFor: LeadAssignmentPositions.BACKEND,
          invitedAt: new Date(),
        },
      ];
      leadCandidateRepo.find.mockResolvedValue(candidates);

      const result = await service.isExistingCandidates(
        'candidate1@example.com',
        sessId,
      );

      expect(result).toBe(true);
      expect(leadCandidateRepo.find).toHaveBeenCalledWith({
        sessionId: expect.any(mongoose.Types.ObjectId),
      });
    });

    it('should return false when no candidate with the given email exists in the session', async () => {
      const sessionId = new mongoose.Types.ObjectId();
      const sessId = sessionId.toString();

      const candidates: LeadCandidate[] = [
        {
          email: 'candidate1@example.com',
          userId: new mongoose.Types.ObjectId(),
          sessionId,
          status: LeadCandidateStatus.INVITED,
          recommendedBy: new mongoose.Types.ObjectId(),
          recommendedAt: new Date(),
          recommendedFor: LeadAssignmentPositions.BACKEND,
          invitedAt: new Date(),
        },
      ];
      leadCandidateRepo.find.mockResolvedValue(candidates);

      const result = await service.isExistingCandidates(
        'nonexistent@example.com',
        sessId,
      );

      expect(result).toBe(false);
    });

    it('should return false when there are no candidates in the session', async () => {
      const sessId = new mongoose.Types.ObjectId().toString();

      leadCandidateRepo.find.mockResolvedValue([]);

      const result = await service.isExistingCandidates(
        'candidate1@example.com',
        sessId,
      );

      expect(result).toBe(false);
    });
  });
});
