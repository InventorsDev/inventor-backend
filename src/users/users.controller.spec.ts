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
// imported to handle the paginated response from findAll
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Document, Model, Types } from 'mongoose';
import { IPageable } from 'src/shared/utils';
type UserDocument = Document<unknown, {}, User> &
  User & { _id: Types.ObjectId };

/*
'*generates a mock user object that can be used across multiple tests
 *choose which part you want to override using createMock({parameter:new_value})
*/

const createUserMock = (
  overrides: Partial<UserDocument> = {},
): UserDocument => {
  return {
    _id: new Types.ObjectId(),
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'hashedpassword123',
    profileSummary: 'Experienced software engineer',
    jobTitle: 'Senior Developer',
    currentCompany: 'TechCorp',
    photo: 'profilephoto.jpg',
    age: 30,
    phone: '123-456-7890',
    userHandle: 'johnDoe123',
    gender: 'male',
    location: {
      type: 'Point',
      coordinates: [40.7128, -74.006],
    },
    deviceId: 'device12345',
    deviceToken: 'deviceToken12345',
    role: [UserRole.USER],
    leadPosition: 'Tech Lead',
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
    ...overrides, // Overrides allow customization of the mock
  } as UserDocument;
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

  describe('findByUsername', () => {
    const requestMock = { email: 'test@example.com' };
    it('should return true', async () => {
      const userMock = createUserMock({
        email: 'test@example.com',
      });
      // redirecting the dbquery to use the userMock
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(userMock);
      const result = await adminController.findByUsername(requestMock.email);

      expect(result).toEqual(true);
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
    });
    it('should return false', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      const result = await adminController.findByUsername(requestMock.email);

      expect(result).toEqual(false);
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('findAll', () => {
    // clearing mock data between test to prevent data leaking
    beforeEach(() => {
      jest.clearAllMocks();
    });

    // create a diffenent request for api
    const createRequestMock = (query = {}): ApiReq => ({
      query: {
        page: '1',
        limit: '10',
        order: 'DESC',
        ...query,
      },
    });

    it('should return paginated users with default parameters', async () => {
      // Create mock request
      const requestMock = createRequestMock();

      // mongoose record style and spreads a user data onto it
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
      // expected findAll service response
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

      const mockRecords = [
        {
          _id: new Types.ObjectId(),
          ...createUserMock(),
        },
      ];

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
  describe('change Password', () => {
    const mockUser = createUserMock({ _id: new Types.ObjectId() });
    const mockRequest = {
      user: {
        _id: mockUser._id,
        email: mockUser.email,
        role: [UserRole.ADMIN],
      },
    };
    const UserChangePasswordDto = {
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
        UserChangePasswordDto,
      );
      expect(result).toEqual(updatedUser);
      expect(usersService.changePassword).toHaveBeenLastCalledWith(
        mockRequest,
        mockUser._id.toString(),
        UserChangePasswordDto,
        true,
      );
    });
  });
  describe('userInvite', () => {
    const inviteDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      roles: [UserRole.USER],
      joinMethod: RegistrationMethod.SIGN_UP,
    };
    it('should successfully invite a user', async () => {
      const expectedResult = createUserMock(inviteDto);
      jest.spyOn(usersService, 'userInvite').mockResolvedValue(expectedResult);
      const result = await adminController.userInvite(inviteDto);
      expect(result).toEqual(expectedResult);
      expect(usersService.userInvite).toHaveBeenCalledWith(inviteDto);
    });
    it('should throw error when inviting existing user', async () => {
      jest
        .spyOn(usersService, 'userInvite')
        .mockRejectedValue(new BadRequestException('User already exists'));

      await expect(adminController.userInvite(inviteDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error when email is invalid', async () => {
      const invalidDto = { ...inviteDto, email: 'invalid-email' };

      jest
        .spyOn(usersService, 'userInvite')
        .mockRejectedValue(new BadRequestException('Invalid email format'));

      await expect(adminController.userInvite(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
  describe('getUserProfile', () => {
    it('should return the user profile', async () => {
      const mockUser = createUserMock();
      const mockReq = { user: mockUser };

      jest.spyOn(usersService, 'findMe').mockResolvedValue(mockUser);

      const result = await adminController.getUserProfile(mockReq);

      expect(result).toEqual(mockUser);
      expect(usersService.findMe).toHaveBeenCalledWith(mockReq);
    });

    it('should throw unauthorized when user not in request', async () => {
      const mockReq = {};

      jest
        .spyOn(usersService, 'findMe')
        .mockRejectedValue(new UnauthorizedException());

      await expect(adminController.getUserProfile(mockReq)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw not found when user profile does not exist', async () => {
      const mockReq = { user: { id: 'non-existent' } };

      jest
        .spyOn(usersService, 'findMe')
        .mockRejectedValue(new NotFoundException('User profile not found'));

      await expect(adminController.getUserProfile(mockReq)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    const userId = new Types.ObjectId().toString();
    const userMock = createUserMock({
      _id: new Types.ObjectId(),
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      role: [UserRole.USER],
    });

    it('should remove a user and return the user object', async () => {
      // Mock the return value to be the user object
      jest.spyOn(usersService, 'remove').mockResolvedValue(userMock);

      const result = await adminController.remove(userId);

      expect(result).toEqual(userMock);
      expect(usersService.remove).toHaveBeenCalledWith(userId);
    });

    it('should throw error when user not found', async () => {
      jest
        .spyOn(usersService, 'remove')
        .mockRejectedValue(
          new NotFoundException(`User  with ID ${userId} not found`),
        );

      await expect(adminController.remove(userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error when trying to remove admin user', async () => {
      // Assuming you have logic in your service to prevent admin user deletion
      jest
        .spyOn(usersService, 'remove')
        .mockRejectedValue(new BadRequestException('Cannot remove admin user'));

      await expect(adminController.remove(userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    const userId = new Types.ObjectId();
    const updateDto = {
      userId: userId.toString(),
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update a user', async () => {
      const mockReq = { user: createUserMock({ _id: userId }) };
      const expectedResult = createUserMock({ ...updateDto });

      jest.spyOn(usersService, 'update').mockResolvedValue(expectedResult);

      const result = await adminController.update(mockReq, updateDto);

      expect(result).toEqual(expectedResult);

      expect(usersService.update).toHaveBeenCalledWith(
        userId.toString(),
        updateDto,
      );
    });

    it('should throw error when user not found', async () => {
      const mockReq = { user: createUserMock({ _id: userId }) };

      jest
        .spyOn(usersService, 'update')
        .mockRejectedValue(new NotFoundException('User not found'));

      await expect(adminController.update(mockReq, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error when invalid data provided', async () => {
      const mockReq = { user: createUserMock({ _id: userId }) };
      const invalidDto = { userId: userId.toString(), firstName: '' };

      jest
        .spyOn(usersService, 'update')
        .mockRejectedValue(new BadRequestException('Invalid user data'));

      await expect(adminController.update(mockReq, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('addPhoto', () => {
    const userId = new Types.ObjectId().toString();
    const photoDto = {
      userId,
      photo: 'new-photo-url.jpg',
    };

    it('should add a photo to user profile', async () => {
      const mockReq = { user: createUserMock() };
      const expectedResult = createUserMock({ photo: photoDto.photo });

      jest.spyOn(usersService, 'addPhoto').mockResolvedValue(expectedResult);

      const result = await adminController.addPhoto(mockReq, userId, photoDto);

      expect(result).toEqual(expectedResult);
      expect(usersService.addPhoto).toHaveBeenCalledWith(
        photoDto.userId,
        photoDto,
      );
    });

    it('should throw error when invalid photo format', async () => {
      const mockReq = { user: createUserMock() };
      const invalidPhotoDto = { ...photoDto, photo: 'invalid-format' };

      jest
        .spyOn(usersService, 'addPhoto')
        .mockRejectedValue(new BadRequestException('Invalid photo format'));

      await expect(
        adminController.addPhoto(mockReq, userId, invalidPhotoDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when photo size exceeds limit', async () => {
      const mockReq = { user: createUserMock() };

      jest
        .spyOn(usersService, 'addPhoto')
        .mockRejectedValue(new BadRequestException('Photo size exceeds limit'));

      await expect(
        adminController.addPhoto(mockReq, userId, photoDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('RequestVerificationToken', () => {
    const userId = new Types.ObjectId().toString();

    it('should request new verification token', async () => {
      const mockReq = { user: createUserMock() };
      // Mocking the requestVerification method to resolve successfully
      jest
        .spyOn(usersService, 'requestVerification')
        .mockResolvedValue(undefined); // or just don't mock return value

      await adminController.RequestVerificationToken(mockReq, userId);

      expect(usersService.requestVerification).toHaveBeenCalledWith(
        mockReq,
        userId,
      );
    });

    it('should throw error when user not found', async () => {
      const mockReq = { user: createUserMock() };

      jest
        .spyOn(usersService, 'requestVerification')
        .mockRejectedValue(new Error('User  not found'));

      await expect(
        adminController.RequestVerificationToken(mockReq, userId),
      ).rejects.toThrow('User  not found');
    });

    it('should throw error when verification request not allowed', async () => {
      const mockReq = { user: createUserMock() };

      jest
        .spyOn(usersService, 'requestVerification')
        .mockRejectedValue(
          new Error('Verification request not allowed at this time'),
        );

      await expect(
        adminController.RequestVerificationToken(mockReq, userId),
      ).rejects.toThrow('Verification request not allowed at this time');
    });

    it('should throw error when user already verified', async () => {
      const mockReq = {
        user: createUserMock({ applicationStatus: ApplicationStatus.APPROVED }),
      };

      jest
        .spyOn(usersService, 'requestVerification')
        .mockRejectedValue(new Error('User  is already verified'));

      await expect(
        adminController.RequestVerificationToken(mockReq, userId),
      ).rejects.toThrow('User  is already verified');
    });

    it('should throw error when too many requests', async () => {
      const mockReq = { user: createUserMock() };

      jest
        .spyOn(usersService, 'requestVerification')
        .mockRejectedValue(new Error('Too many verification requests'));

      await expect(
        adminController.RequestVerificationToken(mockReq, userId),
      ).rejects.toThrow('Too many verification requests');
    });
  });

  describe('updateUser Status', () => {
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

    it('should throw error when updating to invalid status', async () => {
      const invalidStatusDto = { status: 'INVALID_STATUS' as UserStatus };
      const mockReq = { user: createUserMock() };

      jest
        .spyOn(usersService, 'updateStatus')
        .mockRejectedValue(new BadRequestException('Invalid user status'));

      await expect(
        adminController.updateUserStatus(mockReq, userId, invalidStatusDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when updating non-existent user', async () => {
      const statusDto = { status: UserStatus.ACTIVE };
      const mockReq = { user: createUserMock() };
      // Mocking the service to throw an error when the user is not found
      jest
        .spyOn(usersService, 'updateStatus')
        .mockRejectedValue(new NotFoundException('User  not found'));

      await expect(
        adminController.updateUserStatus(mockReq, userId, statusDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

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
      it('should reject a lead application with custom message', async () => {
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

      it('should reject with default message when no message provided', async () => {
        const email = 'lead@example.com';
        const rejectDto = {};
        const expectedResult = 'Application rejected successfully';

        jest
          .spyOn(usersService, 'rejectTempApplication')
          .mockResolvedValue(expectedResult);

        const result = await adminController.reject(email, rejectDto);

        expect(result).toEqual(expectedResult);
        expect(usersService.rejectTempApplication).toHaveBeenCalledWith(
          email,
          'Your application was rejected',
        );
      });
    });

    describe('generateLink', () => {
      it('should generate registration link for lead', async () => {
        const email = 'lead@example.com';
        const expectedLink = 'http://example.com/register/token123';

        jest.spyOn(usersService, 'inviteLead').mockResolvedValue(expectedLink);

        const result = await adminController.generateLink(email);

        expect(result).toEqual({ link: expectedLink });
        expect(usersService.inviteLead).toHaveBeenCalledWith(email);
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

  describe('Deactivate User Account', () => {
    const userId = new Types.ObjectId().toString();
    const deactivateDto = { reason: 'Taking a break' };

    it('should deactivate a user account', async () => {
      const mockReq = { user: createUserMock() };
      const expectedResult = createUserMock({ status: UserStatus.DEACTIVATED });

      jest
        .spyOn(usersService, 'deactivateAccount')
        .mockResolvedValue(expectedResult);

      const result = await controller.deactivateAccount(
        mockReq,
        userId,
        deactivateDto,
      );

      expect(result).toEqual(expectedResult);
      expect(usersService.deactivateAccount).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException when user not found', async () => {
      const mockReq = { user: createUserMock() };

      jest
        .spyOn(usersService, 'deactivateAccount')
        .mockRejectedValue(
          new NotFoundException(`User with ID ${userId} not found`),
        );

      await expect(
        controller.deactivateAccount(mockReq, userId, deactivateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user cannot be deactivated', async () => {
      const mockReq = { user: createUserMock() };

      jest
        .spyOn(usersService, 'deactivateAccount')
        .mockRejectedValue(
          new BadRequestException(
            'User account cannot be deactivated at this time',
          ),
        );

      await expect(
        controller.deactivateAccount(mockReq, userId, deactivateDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Request Reactivation', () => {
    const userId = new Types.ObjectId().toString();
    const reactivationDto = { message: 'Ready to come back' };

    it('should request reactivation of a user account', async () => {
      const expectedResult = createUserMock({ status: UserStatus.ACTIVE });

      jest
        .spyOn(usersService, 'requestReactivation')
        .mockResolvedValue(expectedResult);

      const result = await controller.requestReactivation(
        userId,
        reactivationDto,
      );

      expect(result).toEqual(expectedResult);
      expect(usersService.requestReactivation).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException when user not found', async () => {
      jest
        .spyOn(usersService, 'requestReactivation')
        .mockRejectedValue(
          new NotFoundException(`User with ID ${userId} not found`),
        );

      await expect(
        controller.requestReactivation(userId, reactivationDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user cannot be reactivated', async () => {
      jest
        .spyOn(usersService, 'requestReactivation')
        .mockRejectedValue(
          new BadRequestException(
            'User account cannot be reactivated at this time',
          ),
        );

      await expect(
        controller.requestReactivation(userId, reactivationDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Lead Registration', () => {
    const tempLeadDto = {
      email: 'lead@example.com',
      leadPosition: 'Senior Developer',
      firstName: 'John',
      lastName: 'Doe',
      createdAt: new Date(),
    };

    it('should successfully register a temporary lead', async () => {
      const expectedResult = 'Application sent';

      jest
        .spyOn(usersService, 'createTempRegistration')
        .mockResolvedValue(expectedResult);

      const result = await controller.createLead(tempLeadDto);

      expect(result).toEqual(expectedResult);
      expect(usersService.createTempRegistration).toHaveBeenCalledWith(
        tempLeadDto.email,
        tempLeadDto.leadPosition,
      );
    });

    it('should throw BadRequestException when lead registration is not allowed yet', async () => {
      const errorMessage =
        'The next time you can apply as a lead is Monday, January 1st, 10:00 am';

      jest
        .spyOn(usersService, 'createTempRegistration')
        .mockRejectedValue(new BadRequestException(errorMessage));

      await expect(controller.createLead(tempLeadDto)).rejects.toThrow(
        new BadRequestException(errorMessage),
      );
    });

    it('should handle errors during lead registration', async () => {
      jest
        .spyOn(usersService, 'createTempRegistration')
        .mockRejectedValue(new Error('Error updating user'));

      await expect(controller.createLead(tempLeadDto)).rejects.toThrow(Error);
    });
  });

  describe('Register New User Form', () => {
    const encryptedData = 'encryptedString';
    const userId = new Types.ObjectId().toString();
    const email = 'user@example.com';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should redirect to new user form when userId is missing', async () => {
      jest.spyOn(usersService, 'paraseEncryptedParams').mockReturnValue({
        userId: '',
        email,
      });

      const result = await controller.register(encryptedData);

      expect(result).toEqual({
        url: `/leads/new-user-form?email=${encodeURIComponent(email)}`,
      });
    });

    it('should redirect to create lead page when user exists', async () => {
      const mockUser = createUserMock({
        _id: new Types.ObjectId(userId),
        email,
      });

      jest.spyOn(usersService, 'paraseEncryptedParams').mockReturnValue({
        userId,
        email,
      });

      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);

      const result = await controller.register(encryptedData);

      expect(result).toEqual({
        url: `/leads/createLead?email=${email}`,
      });
      expect(usersService.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      jest.spyOn(usersService, 'paraseEncryptedParams').mockReturnValue({
        userId,
        email,
      });

      jest
        .spyOn(usersService, 'findById')
        .mockRejectedValue(
          new NotFoundException(`User with ID ${userId} not found`),
        );

      await expect(controller.register(encryptedData)).rejects.toThrow(
        new NotFoundException('Invalid link'),
      );
    });

    it('should throw NotFoundException when decryption fails', async () => {
      jest
        .spyOn(usersService, 'paraseEncryptedParams')
        .mockImplementation(() => {
          throw new Error('Decryption failed');
        });

      await expect(controller.register(encryptedData)).rejects.toThrow(
        new NotFoundException('Invalid link'),
      );
    });
  });

  describe('User Invite Link', () => {
    const encryptedData = 'encryptedInviteString';
    const userId = new Types.ObjectId().toString();
    const email = 'invite@example.com';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should process an invite link and redirect to the appropriate page', async () => {
      const mockUser = createUserMock({
        _id: new Types.ObjectId(userId),
        email,
      });

      jest.spyOn(usersService, 'paraseEncryptedParams').mockReturnValue({
        userId,
        email,
      });

      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);

      const result = await controller.register(encryptedData);

      expect(result).toEqual({
        url: `/leads/createLead?email=${email}`,
      });
      expect(usersService.paraseEncryptedParams).toHaveBeenCalledWith(
        encryptedData,
      );
    });

    it('should handle invite link with missing parameters correctly', async () => {
      jest.spyOn(usersService, 'paraseEncryptedParams').mockReturnValue({
        userId: '',
        email,
      });

      const result = await controller.register(encryptedData);

      expect(result).toEqual({
        url: `/leads/new-user-form?email=${encodeURIComponent(email)}`,
      });
    });

    it('should test the parameter parsing function', () => {
      const decryptMock = jest
        .fn()
        .mockReturnValue('userId=123&email=test@example.com');
      global.decrypt = decryptMock;

      const encryptedParams = 'encoded%20string';
    });
  });
});
