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
} from 'src/shared/interfaces';
import { mock } from 'node:test';
import { Types } from 'mongoose';

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
  describe('change Password', () => {
    const mockUser = createUserMock({_id: new Types.ObjectId(),});
    const mockRequest = {
      user: {
        _id: mockUser._id,
        email: mockUser.email,
        role: [UserRole.ADMIN],
      },
    };
    const UserChangePasswordDto = {
      oldPassword: 'oldPassword@123'
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
});

/*
'*generates a mock user object that can be used across multiple tests
 *choose which part you want to override using createMock({parameter:new_value})
*/
const createUserMock = (overrides: Partial<User> = {}): User => {
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
    ...overrides, // Overrides will allow you to customize the mock as needed
  };
};
