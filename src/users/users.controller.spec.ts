import { Test, TestingModule } from '@nestjs/testing';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtUsersGuard } from 'src/shared/auth/guards/jwt.users.guard';

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

import { RequestReactivationDto } from './dto/request-reactivation.dto';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UserChangePasswordDto } from './dto/user-change-password.dto';
import { TempLeadDto } from './dto/temp-lead.dto';
import { CreateUserDto } from 'src/shared/dtos/create-user.dto';
import { User } from 'src/shared/schema';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = { _id: '123', email: 'tdennis.developer@gmail.com' };

  const mockUsersService = {
    findMe: jest.fn().mockResolvedValue(mockUser),
    changePassword: jest.fn(),
    findAll: jest.fn().mockResolvedValue([mockUser]),
    findById: jest.fn().mockResolvedValue(mockUser),
    findByEmail: jest.fn().mockResolvedValue(mockUser),
    update: jest.fn(),
    addPhoto: jest.fn(),
    createTempRegistration: jest.fn().mockResolvedValue('temp-registration-id'),
    createUser: jest.fn().mockResolvedValue(mockUser),
    requestVerification: jest.fn(),
    deactivateAccount: jest.fn(),
    requestReactivation: jest.fn(),
    paraseEncryptedParams: jest.fn().mockReturnValue({
      userId: '6706619dbee933e796f61484',
      email: 'tdennis.developer@gmail.com',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtUsersGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mock calls between tests
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('myProfile', () => {
    it('should return the user profile', async () => {
      const req = { user: { _id: '123' } };
      const result = await controller.myProfile(req);
      expect(result).toEqual(mockUser);
      expect(service.findMe).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const req = {};
      const result = await controller.findAll(req);
      expect(result).toEqual([mockUser]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      const result = await controller.findOne('6706619dbee933e796f61484');
      expect(result).toEqual(mockUser);
      expect(service.findById).toHaveBeenCalledWith('6706619dbee933e796f61484');
    });

    it('should throw NotFoundException if user is not found', async () => {
      jest.spyOn(service, 'findById').mockResolvedValueOnce(null);

      await expect(controller.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByUsername', () => {
    it('should return true if user exists', async () => {
      const result = await controller.findByUsername(
        'tdennis.developer@gmail.com',
      );
      expect(result).toBe(true);
      expect(service.findByEmail).toHaveBeenCalledWith(
        'tdennis.developer@gmail.com',
      );
    });

    it('should return false if user does not exist', async () => {
      jest.spyOn(service, 'findByEmail').mockResolvedValueOnce(null);
      const result = await controller.findByUsername('nonexistent@example.com');
      expect(result).toBe(false);
    });
  });

  describe('changePassword', () => {
    it('should call changePassword with correct arguments', async () => {
      const req = { user: { _id: '6706619dbee933e796f61484' } };
      const payload: UserChangePasswordDto = {
        oldPassword: 'old',
        newPassword: 'new',
        confirmPassword: 'new',
      };

      await controller.changePassword(req, payload);
      expect(service.changePassword).toHaveBeenCalledWith(
        req,
        '6706619dbee933e796f61484',
        payload,
      );
    });
  });

  describe('createLead', () => {
    it('should create a temporary lead registration', async () => {
      const payload: TempLeadDto = {
        email: 'lead@gmail.com',
        leadPosition: 'manager',
        firstName: 'Dennis',
        lastName: 'Dennis',
        createdAt: new Date(),
      };
      const result = await controller.createLead(payload);
      expect(result).toBe('temp-registration-id');
    });
  });

  describe('register', () => {
    it('should redirect to new user form if userId is not found', async () => {
      mockUsersService.paraseEncryptedParams.mockReturnValueOnce({
        email: 'tdennis.developer@gmail.com',
      });
      const result = await controller.register('encrypted-data');
      expect(result).toEqual({
        url: `/leads/new-user-form?email=tdennis.developer%40gmail.com`,
      });
    });

    it('should throw NotFoundException for invalid link', async () => {
      mockUsersService.paraseEncryptedParams.mockImplementationOnce(() => {
        throw new Error();
      });

      await expect(controller.register('invalid-data')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

      // redirecting the dbquery to use the userMock
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(userMock);
      const result = await adminController.findByUsername(requestMock.email);


  describe('newUserForm', () => {
    it('should create a new user and return redirect URL', async () => {
      const payload: CreateUserDto = {
        email: 'tdennis.developer@gmail.com',
        password: 'password',
        joinMethod: RegistrationMethod.SIGN_UP,
        firstName: 'Dennis',
        lastName: 'Dennis',
      };
      const result = await controller.newUserForm(payload);
      expect(result).toEqual({
        url: `/leads/create?email=${payload.email}`,
      });
    });

    it('should throw InternalServerErrorException on failure', async () => {
      jest.spyOn(service, 'createUser').mockImplementationOnce(() => {
        throw new Error();
      });
      await expect(
        controller.newUserForm({
          email: '',
          password: '',
          lastName: '',
          firstName: '',
          joinMethod: RegistrationMethod.SIGN_UP,
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deactivateAccount', () => {
    it('should call deactivateAccount with correct arguments', async () => {
      const req = { user: { _id: '123' } };
      const payload = { reason: 'No longer needed' };

      await controller.deactivateAccount(req, '123', payload);
      expect(service.deactivateAccount).toHaveBeenCalledWith('123');
    });
  });

  describe('requestReactivation', () => {
    it('should call requestReactivation with correct arguments', async () => {
      const payload: RequestReactivationDto = { message: 'Please reactivate' };
      await controller.requestReactivation('123', payload);
      expect(service.requestReactivation).toHaveBeenCalledWith('123');
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
describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = { _id: '123', email: 'tdennis.developer@gmail.com' };

  const mockUsersService = {
    findMe: jest.fn().mockResolvedValue(mockUser),
    changePassword: jest.fn(),
    findAll: jest.fn().mockResolvedValue([mockUser]),
    findById: jest.fn().mockResolvedValue(mockUser),
    findByEmail: jest.fn().mockResolvedValue(mockUser),
    update: jest.fn(),
    addPhoto: jest.fn(),
    createTempRegistration: jest.fn().mockResolvedValue('temp-registration-id'),
    createUser: jest.fn().mockResolvedValue(mockUser),
    requestVerification: jest.fn(),
    deactivateAccount: jest.fn(),
    requestReactivation: jest.fn(),
    paraseEncryptedParams: jest.fn().mockReturnValue({
      userId: '6706619dbee933e796f61484',
      email: 'tdennis.developer@gmail.com',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtUsersGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Add the additional describe blocks from the second code here, as-is.
  describe('myProfile', () => {
    it('should return the user profile', async () => {
      const req = { user: { _id: '123' } };
      const result = await controller.myProfile(req);
      expect(result).toEqual(mockUser);
      expect(service.findMe).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const req = {};
      const result = await controller.findAll(req);
      expect(result).toEqual([mockUser]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      const result = await controller.findOne('6706619dbee933e796f61484');
      expect(result).toEqual(mockUser);
      expect(service.findById).toHaveBeenCalledWith('6706619dbee933e796f61484');
    });

    it('should throw NotFoundException if user is not found', async () => {
      jest.spyOn(service, 'findById').mockResolvedValueOnce(null);

      await expect(controller.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByUsername', () => {
    it('should return true if user exists', async () => {
      const result = await controller.findByUsername(
        'tdennis.developer@gmail.com',
      );
      expect(result).toBe(true);
      expect(service.findByEmail).toHaveBeenCalledWith(
        'tdennis.developer@gmail.com',
      );
    });

    it('should return false if user does not exist', async () => {
      jest.spyOn(service, 'findByEmail').mockResolvedValueOnce(null);
      const result = await controller.findByUsername('nonexistent@example.com');
      expect(result).toBe(false);
    });
  });

  describe('changePassword', () => {
    it('should call changePassword with correct arguments', async () => {
      const req = { user: { _id: '6706619dbee933e796f61484' } };
      const payload: UserChangePasswordDto = {
        oldPassword: 'old',
        newPassword: 'new',
        confirmPassword: 'new',
      };

      await controller.changePassword(req, payload);
      expect(service.changePassword).toHaveBeenCalledWith(
        req,
        '6706619dbee933e796f61484',
        payload,
      );
    });
  });

  describe('createLead', () => {
    it('should create a temporary lead registration', async () => {
      const payload: TempLeadDto = {
        email: 'lead@gmail.com',
        leadPosition: 'manager',
        firstName: 'Dennis',
        lastName: 'Dennis',
        createdAt: new Date(),
      };
      const result = await controller.createLead(payload);
      expect(result).toBe('temp-registration-id');
    });
  });

  describe('register', () => {
    it('should redirect to new user form if userId is not found', async () => {
      mockUsersService.paraseEncryptedParams.mockReturnValueOnce({
        email: 'tdennis.developer@gmail.com',
      });
      const result = await controller.register('encrypted-data');
      expect(result).toEqual({
        url: `/leads/new-user-form?email=tdennis.developer%40gmail.com`,
      });
    });

    it('should throw NotFoundException for invalid link', async () => {
      mockUsersService.paraseEncryptedParams.mockImplementationOnce(() => {
        throw new Error();
      });
      await expect(controller.register('invalid-data')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('newUserForm', () => {
    it('should create a new user and return redirect URL', async () => {
      const payload: CreateUserDto = {
        email: 'tdennis.developer@gmail.com',
        password: 'password',
        joinMethod: RegistrationMethod.SIGN_UP,
        firstName: 'Dennis',
        lastName: 'Dennis',
      };
      const result = await controller.newUserForm(payload);
      expect(result).toEqual({
        url: `/leads/create?email=${payload.email}`,
      });
    });

    it('should throw InternalServerErrorException on failure', async () => {
      jest.spyOn(service, 'createUser').mockImplementationOnce(() => {
        throw new Error();
      });
      await expect(
        controller.newUserForm({
          email: '',
          password: '',
          lastName: '',
          firstName: '',
          joinMethod: RegistrationMethod.SIGN_UP,
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deactivateAccount', () => {
    it('should call deactivateAccount with correct arguments', async () => {
      const req = { user: { _id: '123' } };
      const payload = { reason: 'No longer needed' };

      await controller.deactivateAccount(req, '123', payload);
      expect(service.deactivateAccount).toHaveBeenCalledWith('123');
    });
  });

  describe('requestReactivation', () => {
    it('should call requestReactivation with correct arguments', async () => {
      const payload: RequestReactivationDto = { message: 'Please reactivate' };
      await controller.requestReactivation('123', payload);
      expect(service.requestReactivation).toHaveBeenCalledWith('123');
=======
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
});
