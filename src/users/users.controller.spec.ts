import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TestModule } from 'src/shared/testkits';
import { UsersAdminsController } from './users.admin.controller';
import { DBModule, User } from 'src/shared/schema';
import {
  ApplicationStatus,
  RegistrationMethod,
  UserRole,
  UserStatus,
  ApiReq,
} from 'src/shared/interfaces';
// imported to handle the paginated response from findAll
import { Model, Document, Types } from 'mongoose';
import { IPageable } from 'src/shared/utils';
type UserDocument = Document<unknown, {}, User> &
  User & { _id: Types.ObjectId };

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
      // redirecting the dbquery to user the userMock
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
});

/*
'*generates a mock user object that can be used across multiple tests
 *choose which part you want to override using createMock({parameter:new_value})
*/
const createUserMock = (overrides: Partial<User> = {}): User => {
  return {
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
    ...overrides, // Overrides will allow you to customize the mock as needed
  };
};
