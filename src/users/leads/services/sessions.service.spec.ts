import {
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';

import {
    SchoolSession,
    SchoolSessionStatus,
    SchoolNames,
    type SchoolSessionDocumet,
} from 'src/shared/schema';

import { SessionService } from './sessions.service';

describe('SessionService', () => {
    let service: SessionService;

    let schoolSessionRepo: {
        findById: jest.Mock;
        find: jest.Mock;
    };

    beforeEach(async () => {
        schoolSessionRepo = {
            findById: jest.fn(),
            find: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SessionService,
                {
                    provide: SchoolSession.name,
                    useValue: schoolSessionRepo,
                },
            ],
        }).compile();

        service = module.get<SessionService>(SessionService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getActiveSessions', () => {
        it('should return all active sessions when no school name is provided', async () => {
            const sessions = [
                {
                    name: SchoolNames.OAUSTECH,
                    status: SchoolSessionStatus.ACTIVE,
                    startsAt: new Date(),
                    endsAt: new Date(),
                },
            ];

            schoolSessionRepo.find.mockResolvedValue(sessions);

            const result = await service.getActiveSessions();

            expect(result).toEqual(sessions);

            expect(schoolSessionRepo.find).toHaveBeenCalledWith({
                status: SchoolSessionStatus.ACTIVE,
            });
        });

        it('should return active sessions for a specific school', async () => {
            const sessions = [
                {
                    name: SchoolNames.BELLS,
                    status: SchoolSessionStatus.ACTIVE,
                    startsAt: new Date(),
                    endsAt: new Date(),
                },
            ];

            schoolSessionRepo.find.mockResolvedValue(sessions);

            const result = await service.getActiveSessions(SchoolNames.BELLS);

            expect(result).toEqual(sessions);

            expect(schoolSessionRepo.find).toHaveBeenCalledWith({
                status: SchoolSessionStatus.ACTIVE,
                name: SchoolNames.BELLS,
            });
        });
    });

    describe('isSessionValid', () => {
        it('should return true for a valid active session', async () => {
            const currentSession = {
                name: SchoolNames.OAUSTECH,
                status: SchoolSessionStatus.ACTIVE,
                startsAt: new Date(),
                endsAt: new Date(
                    Date.now() + 2 * 30 * 24 * 60 * 60 * 1000,
                ),
            };

            const activeSessions = [
                currentSession,
            ];

            schoolSessionRepo.findById.mockResolvedValue(currentSession);
            schoolSessionRepo.find.mockResolvedValue(activeSessions);

            const result = await service.isSessionValid(
                'some-session-id' as any,
            );

            expect(result).toBe(true);

            expect(schoolSessionRepo.findById).toHaveBeenCalledWith(
                'some-session-id',
            );

            expect(schoolSessionRepo.find).toHaveBeenCalledWith({
                status: SchoolSessionStatus.ACTIVE,
            });
        });

        it('should throw NotFoundException when the session does not exist', async () => {
            schoolSessionRepo.findById.mockResolvedValue(null);

            await expect(
                service.isSessionValid('invalid-session-id' as any),
            ).rejects.toThrow(
                new NotFoundException('Invalid Session Id'),
            );

            expect(schoolSessionRepo.findById).toHaveBeenCalledWith(
                'invalid-session-id',
            );
        });

        it('should throw BadRequestException when the session is not active', async () => {
            const endedSession = {
                name: SchoolNames.OAUSTECH,
                status: SchoolSessionStatus.ENDED,
                startsAt: new Date(),
                endsAt: new Date(Date.now() + 2 * 30 * 24 * 60 * 60 * 1000),
            };

            schoolSessionRepo.findById.mockResolvedValue(endedSession);

            await expect(
                service.isSessionValid('some-session-id' as any),
            ).rejects.toThrow(
                new BadRequestException('session is not active'),
            );

            expect(schoolSessionRepo.find).not.toHaveBeenCalled();
        });

        it('should return false when there is no matching school session', async () => {
            const currentSession = {
                name: SchoolNames.OAUSTECH,
                status: SchoolSessionStatus.ACTIVE,
                startsAt: new Date(),
                endsAt: new Date(
                    Date.now() + 2 * 30 * 24 * 60 * 60 * 1000,
                ),
            };

            const activeSessions = [
                {
                    name: SchoolNames.BELLS,
                    status: SchoolSessionStatus.ACTIVE,
                    startsAt: new Date(),
                    endsAt: new Date(
                        Date.now() + 2 * 30 * 24 * 60 * 60 * 1000,
                    ),
                },
            ];

            schoolSessionRepo.findById.mockResolvedValue(currentSession);
            schoolSessionRepo.find.mockResolvedValue(activeSessions);

            const result = await service.isSessionValid(
                'some-session-id' as any,
            );

            expect(result).toBe(false);
        });

        it('should return false when the session ends within one month', async () => {
            const currentSession = {
                name: SchoolNames.OAUSTECH,
                status: SchoolSessionStatus.ACTIVE,
                startsAt: new Date(),
                endsAt: new Date(
                    Date.now() + 7 * 24 * 60 * 60 * 1000,
                ),
            };

            schoolSessionRepo.findById.mockResolvedValue(currentSession);
            schoolSessionRepo.find.mockResolvedValue([currentSession]);

            const result = await service.isSessionValid(
                'some-session-id' as any,
            );

            expect(result).toBe(false);
        });

        it('should use the school name when one is provided', async () => {
            const currentSession = {
                name: SchoolNames.BELLS,
                status: SchoolSessionStatus.ACTIVE,
                startsAt: new Date(),
                endsAt: new Date(
                    Date.now() + 2 * 30 * 24 * 60 * 60 * 1000,
                ),
            };

            schoolSessionRepo.findById.mockResolvedValue(currentSession);
            schoolSessionRepo.find.mockResolvedValue([currentSession]);

            await service.isSessionValid(
                'some-session-id' as any,
                SchoolNames.BELLS,
            );

            expect(schoolSessionRepo.find).toHaveBeenCalledWith({
                status: SchoolSessionStatus.ACTIVE,
                name: SchoolNames.BELLS,
            });
        });
    });
});