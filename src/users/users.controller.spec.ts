import { Test, TestingModule } from '@nestjs/testing';
import {
  ApiReq,
  ApplicationStatus,
  RegistrationMethod,
  UserRole,
  UserStatus,
} from 'src/shared/interfaces';
import { DBModule, User } from 'src/shared/schema';
import { TestModule } from 'src/shared/testkits';
import { UsersAdminsController } from './users.admin.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from 'src/shared/dtos/create-user.dto';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Document, Types } from 'mongoose';
import { IPageable } from 'src/shared/utils';

type UserDocument = Document<unknown, {}, User> &
  User & { _id: Types.ObjectId };

/*
 * Generates a mock user object that can be used across multiple tests.
 * Override specific fields via createUserMock({ field: value }).
 */
const createUserMock = (
  overrides: Partial<UserDocument> = {},
): UserDocument => {
  return {
    _id: new Types.ObjectId(),
    email: 'john.doe@example.com',
    password: 'hashedpassword123',
    userHandle: 'johnDoe123',
    photo: 'profilephoto.jpg',
    role: [UserRole.USER],
    location: {
      type: 'Point',
      coordinates: [40.7128, -74.006],
    },
    deviceId: 'device12345',
    deviceToken: 'deviceToken12345',
    applicationStatus: ApplicationStatus.PENDING,
    nextApplicationTime: new Date(),
    joinMethod: RegistrationMethod.SIGN_UP,
    status: UserStatus.ACTIVE,
    emailVerification: true,
    pendingInvitation: false,
    socials: {
      phoneNumber: '24242424',
      email: 'balbal',
    },
    nextVerificationRequestDate: new Date(),
    basicInfo: {
      firstName: 'John',
      lastName: 'Doe',
      profileSummary: 'Experienced software engineer',
      phoneNumber: 1234567890,
      city: 'New York',
      country: { location: 'USA' },
    },
    professionalInfo: {
      jobTitle: 'Senior Developer',
      company: 'TechCorp',
      yearsOfExperience: 5,
      school: 'MIT',
      primarySkill: 'Backend',
      secondarySkill: 'DevOps',
      technologies: ['Node.js'],
      interestAreas: ['AI'],
    },
    contactInfo: {
      phone: 1234567890,
      linkedInUrl: 'https://linkedin.com/in/john',
      websiteUrl: 'https://johndoe.dev',
      facebookUrl: '',
      other: [],
    },
    ...overrides,
  } as unknown as UserDocument;
};

describe('UsersAdminController', () => {
  let controller: UsersController;
  let adminController: UsersAdminsController;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule, DBModule],
      controllers: [UsersController, UsersAdminsController],
      providers: [UsersService],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    adminController = module.get<UsersAdminsController>(UsersAdminsController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(adminController).toBeDefined();
  });

  // ─── findByUsername ──────────────────────────────────────────────────────────

  describe('findByUsername', () => {
    const requestMock = { email: 'test@example.com' };

    it('should return true when user exists', async () => {
      const userMock = createUserMock({ email: 'test@example.com' });
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(userMock);

      const result = await adminController.findByUsername(requestMock.email);

      expect(result).toEqual({ exists: true, message: 'User exists' });
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
    });
  });

  // ─── createUser ─────────────────────────────────────────────────────────────

  describe('createUser', () => {
    it('should call usersService.createUser with req and payload', async () => {
      const mockReq = { query: {} } as ApiReq;
      const createDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        joinMethod: RegistrationMethod.SIGN_UP,
      };
      const mockCreatedUser = createUserMock({ email: createDto.email });
      jest
        .spyOn(usersService, 'createUser')
        .mockResolvedValue(mockCreatedUser as any);

      const result = await adminController.createUser(mockReq, createDto);

      expect(result).toEqual(mockCreatedUser);
      expect(usersService.createUser).toHaveBeenCalledWith(mockReq, createDto);
    });
  });

  // ─── update profile ──────────────────────────────────────────────────────────

  describe('update profile', () => {
    const userId = new Types.ObjectId().toString();
    const updateDto = {
      userId,
      email: 'updated@example.com',
      basic_info: { firstName: 'Updated', lastName: 'User' },
      professional_info: { jobTitle: 'Lead Engineer' },
      contact_info: { linkedInUrl: 'https://linkedin.com/in/updated' },
    };
    const mockReq = { user: { _id: userId } };

    it('should update user profile and return updated data', async () => {
      const expectedUpdatedUser = createUserMock({ email: updateDto.email });
      jest.spyOn(usersService, 'update').mockResolvedValue({
        message: 'User updated successfully',
        data: expectedUpdatedUser,
      });

      const result = await controller.update(mockReq, updateDto as any);

      expect(result.message).toEqual('User updated successfully');
      expect(result.data).toEqual(expectedUpdatedUser);
      expect(usersService.update).toHaveBeenCalledWith(userId, updateDto);
    });

    it('should throw BadRequestException when update fails', async () => {
      jest
        .spyOn(usersService, 'update')
        .mockRejectedValue(new BadRequestException('Update failed'));

      await expect(
        controller.update(mockReq, updateDto as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    const createRequestMock = (query = {}): ApiReq => ({
      query: { page: '1', limit: '10', order: 'DESC', ...query },
    });

    it('should return paginated users with default parameters', async () => {
      const requestMock = createRequestMock();
      const mockRecords = [
        {
          _id: new Types.ObjectId(),
          ...createUserMock({ email: 'user1@example.com' }),
        },
        {
          _id: new Types.ObjectId(),
          ...createUserMock({ email: 'user2@example.com' }),
        },
      ];
      const mockPaginatedResponse: IPageable<UserDocument> = {
        results: mockRecords,
        totalRecords: 2,
        perPageLimit: 10,
        totalPages: 1,
        currentPage: 1,
        previousPage: null,
        nextPage: null,
      };
      jest
        .spyOn(usersService, 'findAll')
        .mockResolvedValue(mockPaginatedResponse);

      const result = await adminController.findAll(requestMock);

      expect(result).toEqual(mockPaginatedResponse);
      expect(usersService.findAll).toHaveBeenCalledWith(requestMock);
    });

    it('should handle filtering by user status', async () => {
      const requestMock = createRequestMock({
        userByStatuses: `${UserStatus.ACTIVE},${UserStatus.DISABLE}`,
      });
      const mockRecords = [
        {
          _id: new Types.ObjectId(),
          ...createUserMock({
            email: 'active@example.com',
            status: UserStatus.ACTIVE,
          }),
        },
      ];
      const mockPaginatedResponse: IPageable<UserDocument> = {
        results: mockRecords,
        totalRecords: 1,
        perPageLimit: 10,
        totalPages: 1,
        currentPage: 1,
        previousPage: null,
        nextPage: null,
      };
      jest
        .spyOn(usersService, 'findAll')
        .mockResolvedValue(mockPaginatedResponse);

      const result = await adminController.findAll(requestMock);

      expect(result).toEqual(mockPaginatedResponse);
      expect(usersService.findAll).toHaveBeenCalledWith(requestMock);
    });

    it('should handle filtering by user roles', async () => {
      const requestMock = createRequestMock({
        userByRoles: `${UserRole.USER},${UserRole.ADMIN}`,
      });
      const mockRecords = [
        {
          _id: new Types.ObjectId(),
          ...createUserMock({
            email: 'admin@example.com',
            role: [UserRole.ADMIN],
          }),
        },
      ];
      const mockPaginatedResponse: IPageable<UserDocument> = {
        results: mockRecords,
        totalRecords: 1,
        perPageLimit: 10,
        totalPages: 1,
        currentPage: 1,
        previousPage: null,
        nextPage: null,
      };
      jest
        .spyOn(usersService, 'findAll')
        .mockResolvedValue(mockPaginatedResponse);

      const result = await adminController.findAll(requestMock);

      expect(result).toEqual(mockPaginatedResponse);
      expect(usersService.findAll).toHaveBeenCalledWith(requestMock);
    });

    it('should handle multiple filters combined', async () => {
      const requestMock = createRequestMock({
        userByStatuses: UserStatus.ACTIVE,
        userByRoles: UserRole.USER,
        userDateRange: '2023-01-01,2023-12-31',
        page: '2',
        limit: '5',
        order: 'ASC',
      });
      const mockRecords = [{ _id: new Types.ObjectId(), ...createUserMock() }];
      const mockPaginatedResponse: IPageable<UserDocument> = {
        results: mockRecords,
        totalRecords: 6,
        perPageLimit: 5,
        totalPages: 2,
        currentPage: 2,
        previousPage: 1,
        nextPage: null,
      };
      jest
        .spyOn(usersService, 'findAll')
        .mockResolvedValue(mockPaginatedResponse);

      const result = await adminController.findAll(requestMock);

      expect(result).toEqual(mockPaginatedResponse);
      expect(usersService.findAll).toHaveBeenCalledWith(requestMock);
    });

    it('should handle empty results', async () => {
      const requestMock = createRequestMock({
        userByStatuses: UserStatus.DEACTIVATED,
      });
      const mockPaginatedResponse: IPageable<UserDocument> = {
        results: [],
        totalRecords: 0,
        perPageLimit: 10,
        totalPages: 0,
        currentPage: 1,
        previousPage: null,
        nextPage: null,
      };
      jest
        .spyOn(usersService, 'findAll')
        .mockResolvedValue(mockPaginatedResponse);

      const result = await adminController.findAll(requestMock);

      expect(result).toEqual(mockPaginatedResponse);
      expect(usersService.findAll).toHaveBeenCalledWith(requestMock);
    });
  });

  // ─── changePassword ──────────────────────────────────────────────────────────

  describe('changePassword', () => {
    const mockUser = createUserMock({ _id: new Types.ObjectId() });
    const mockRequest = {
      user: {
        _id: mockUser._id,
        email: mockUser.email,
        role: [UserRole.ADMIN],
      },
    };
    const changePasswordDto = {
      oldPassword: 'oldPassword@123',
      newPassword: 'newPassword@123',
      confirmPassword: 'newPassword@123',
    };

    it('should change the user password', async () => {
      const updatedUser = { ...mockUser, password: 'newHashedPassword' };
      jest.spyOn(usersService, 'changePassword').mockResolvedValue(updatedUser);

      const result = await adminController.changePassword(
        mockRequest,
        mockUser._id.toString(),
        changePasswordDto,
      );

      expect(result).toEqual(updatedUser);
      expect(usersService.changePassword).toHaveBeenCalledWith(
        mockRequest,
        mockUser._id.toString(),
        changePasswordDto,
        true,
      );
    });
  });

  // ─── getUserProfile ──────────────────────────────────────────────────────────

  describe('getUserProfile', () => {
    it('should return the user profile', async () => {
      const mockUser = createUserMock();
      const mockReq = { user: mockUser };
      jest.spyOn(usersService, 'findMe').mockResolvedValue(mockUser);

      const result = await adminController.getUserProfile(mockReq);

      expect(result).toEqual(mockUser);
      expect(usersService.findMe).toHaveBeenCalledWith(mockReq);
    });

    it('should throw UnauthorizedException when user is not in request', async () => {
      const mockReq = {};
      jest
        .spyOn(usersService, 'findMe')
        .mockRejectedValue(new UnauthorizedException());

      await expect(adminController.getUserProfile(mockReq)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw NotFoundException when user profile does not exist', async () => {
      const mockReq = { user: { id: 'non-existent' } };
      jest
        .spyOn(usersService, 'findMe')
        .mockRejectedValue(new NotFoundException('User profile not found'));

      await expect(adminController.getUserProfile(mockReq)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── remove ──────────────────────────────────────────────────────────────────

  describe('remove', () => {
    const userId = new Types.ObjectId().toString();
    const userMock = createUserMock({
      _id: new Types.ObjectId(),
      email: 'test@example.com',
      role: [UserRole.USER],
    });

    it('should remove a user and return the user object', async () => {
      jest.spyOn(usersService, 'remove').mockResolvedValue(userMock);

      const result = await adminController.remove(userId);

      expect(result).toEqual(userMock);
      expect(usersService.remove).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException when user not found', async () => {
      jest
        .spyOn(usersService, 'remove')
        .mockRejectedValue(
          new NotFoundException(`User with ID ${userId} not found`),
        );

      await expect(adminController.remove(userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when trying to remove an admin user', async () => {
      jest
        .spyOn(usersService, 'remove')
        .mockRejectedValue(new BadRequestException('Cannot remove admin user'));

      await expect(adminController.remove(userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── addPhoto ────────────────────────────────────────────────────────────────

  describe('addPhoto', () => {
    const userId = new Types.ObjectId().toString();
    const photoDto = { userId, photo: 'new-photo-url.jpg' };
    const mockReq = { user: createUserMock() };

    it('should add a photo to user profile', async () => {
      const expectedResult = createUserMock();
      jest.spyOn(usersService, 'addPhoto').mockResolvedValue(expectedResult);

      const result = await adminController.addPhoto(mockReq, userId, photoDto);

      expect(result).toEqual(expectedResult);
      expect(usersService.addPhoto).toHaveBeenCalledWith(
        photoDto.userId,
        photoDto,
      );
    });

    it('should throw BadRequestException when photo format is invalid', async () => {
      const invalidPhotoDto = { ...photoDto, photo: 'invalid-format' };
      jest
        .spyOn(usersService, 'addPhoto')
        .mockRejectedValue(new BadRequestException('Invalid photo format'));

      await expect(
        adminController.addPhoto(mockReq, userId, invalidPhotoDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on upload failure', async () => {
      jest
        .spyOn(usersService, 'addPhoto')
        .mockRejectedValue(new BadRequestException());

      await expect(
        adminController.addPhoto(mockReq, userId, photoDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── RequestVerificationToken ────────────────────────────────────────────────

  describe('RequestVerificationToken', () => {
    const userId = new Types.ObjectId().toString();
    const mockReq = { user: createUserMock() };

    it('should request a new verification token', async () => {
      jest
        .spyOn(usersService, 'requestVerification')
        .mockResolvedValue(undefined);

      await adminController.RequestVerificationToken(mockReq, userId);

      expect(usersService.requestVerification).toHaveBeenCalledWith(
        mockReq,
        userId,
      );
    });

    it('should handle verification errors', async () => {
      jest
        .spyOn(usersService, 'requestVerification')
        .mockRejectedValue(new Error('User not found'));

      await expect(
        adminController.RequestVerificationToken(mockReq, userId),
      ).rejects.toThrow('User not found');
    });
  });

  // ─── updateUserStatus ────────────────────────────────────────────────────────

  describe('updateUserStatus', () => {
    const userId = new Types.ObjectId().toString();

    it('should update user status to active', async () => {
      const statusDto = { status: UserStatus.ACTIVE };
      const mockReq = { user: createUserMock() };
      const expectedResult = createUserMock({ status: UserStatus.ACTIVE });
      jest
        .spyOn(usersService, 'updateStatus')
        .mockResolvedValue(expectedResult);

      const result = await adminController.updateUserStatus(
        mockReq,
        userId,
        statusDto,
      );

      expect(result).toEqual(expectedResult);
      expect(usersService.updateStatus).toHaveBeenCalledWith(
        userId,
        statusDto.status,
      );
    });

    it('should throw BadRequestException when updating to an invalid status', async () => {
      const invalidStatusDto = { status: 'INVALID_STATUS' as UserStatus };
      const mockReq = { user: createUserMock() };
      jest
        .spyOn(usersService, 'updateStatus')
        .mockRejectedValue(new BadRequestException('Invalid user status'));

      await expect(
        adminController.updateUserStatus(mockReq, userId, invalidStatusDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when updating a non-existent user', async () => {
      const statusDto = { status: UserStatus.ACTIVE };
      const mockReq = { user: createUserMock() };
      jest
        .spyOn(usersService, 'updateStatus')
        .mockRejectedValue(new NotFoundException('User not found'));

      await expect(
        adminController.updateUserStatus(mockReq, userId, statusDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Lead application endpoints ──────────────────────────────────────────────

  describe('Lead application endpoints', () => {
    describe('getApplicationByEmail', () => {
      it('should find an application by email', async () => {
        const email = 'lead@example.com';
        const expectedResult = createUserMock({ email });
        jest
          .spyOn(usersService, 'viewOneApplication')
          .mockResolvedValue(expectedResult);

        const result = await adminController.getApplicationByEmail(email);

        expect(result).toEqual(expectedResult);
        expect(usersService.viewOneApplication).toHaveBeenCalledWith(email);
      });
    });

    describe('viewApplications', () => {
      it('should return all lead applications', async () => {
        const expectedResults = [
          createUserMock({ email: 'lead1@example.com' }),
          createUserMock({ email: 'lead2@example.com' }),
        ];
        jest
          .spyOn(usersService, 'viewApplications')
          .mockResolvedValue(expectedResults);

        const result = await adminController.viewApplications();

        expect(result).toEqual(expectedResults);
        expect(usersService.viewApplications).toHaveBeenCalled();
      });
    });

    describe('approveApplication', () => {
      it('should approve a lead application', async () => {
        const email = 'lead@example.com';
        const expectedResult = 'Application approved successfully';
        jest
          .spyOn(usersService, 'approveTempApplication')
          .mockResolvedValue(expectedResult);

        const result = await adminController.approveApplication(email);

        expect(result).toEqual(expectedResult);
        expect(usersService.approveTempApplication).toHaveBeenCalledWith(email);
      });
    });

    describe('reject', () => {
      it('should reject a lead application with a custom message', async () => {
        const email = 'lead@example.com';
        const rejectDto = { message: 'Custom rejection message' };
        const expectedResult = 'Application rejected successfully';
        jest
          .spyOn(usersService, 'rejectTempApplication')
          .mockResolvedValue(expectedResult);

        const result = await adminController.reject(email, rejectDto);

        expect(result).toEqual(expectedResult);
        expect(usersService.rejectTempApplication).toHaveBeenCalledWith(
          email,
          rejectDto.message,
        );
      });
    });

    describe('getUsersWithLeadRole', () => {
      it('should return all users with lead role', async () => {
        const expectedResults = [
          createUserMock({ role: [UserRole.LEAD] }),
          createUserMock({ role: [UserRole.LEAD] }),
        ];
        jest
          .spyOn(usersService, 'getUsersWithLeadRole')
          .mockResolvedValue(expectedResults);

        const result = await adminController.getUsersWithLeadRole();

        expect(result).toEqual(expectedResults);
        expect(usersService.getUsersWithLeadRole).toHaveBeenCalled();
      });
    });
  });

  // ─── deactivateAccount (UsersController) ─────────────────────────────────────

  describe('deactivateAccount', () => {
    const mockUser = createUserMock();
    const mockReq = { user: mockUser } as any;

    it('should deactivate the user account', async () => {
      const expectedResult = { message: 'Account deactivated successfully' };
      jest
        .spyOn(usersService, 'deactivateAccount')
        .mockResolvedValue(expectedResult as any);

      const result = await controller.deactivateAccount(mockReq);

      expect(result).toEqual(expectedResult);
      expect(usersService.deactivateAccount).toHaveBeenCalledWith(
        mockUser._id.toString(),
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      jest
        .spyOn(usersService, 'deactivateAccount')
        .mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.deactivateAccount(mockReq)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── Lead Registration (UsersController) ─────────────────────────────────────

  describe('Lead Registration', () => {
    const tempLeadDto = {
      leadPosition: 'Senior Developer',
    };
    const mockReq = { user: { email: 'lead@example.com' } } as any;

    it('should successfully register a temporary lead', async () => {
      const expectedResult = 'Application sent';
      jest
        .spyOn(usersService, 'createTempRegistration')
        .mockResolvedValue(expectedResult);

      const result = await controller.createLead(tempLeadDto, mockReq);

      expect(result).toEqual(expectedResult);
      expect(usersService.createTempRegistration).toHaveBeenCalledWith(
        mockReq.user.email,
        tempLeadDto.leadPosition,
      );
    });

    it('should throw BadRequestException when registration is not allowed', async () => {
      jest
        .spyOn(usersService, 'createTempRegistration')
        .mockRejectedValue(new BadRequestException());

      await expect(controller.createLead(tempLeadDto, mockReq)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
