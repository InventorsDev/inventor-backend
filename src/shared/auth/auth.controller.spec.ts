import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TestModule } from '../testkits';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { DBModule, User, UserDocument } from '../schema';
import {
  ApplicationStatus,
  RegistrationMethod,
  UserRole,
  UserStatus,
} from '../interfaces';
import { CreateUserDto } from '../dtos/create-user.dto';
import { Model } from 'mongoose';

jest.setTimeout(10000)
// Create mock user data
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
    ...overrides,
  };
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let userModel: Model<UserDocument>;

  const mockUser = createUserMock();

  // mock the user model services
  const mockUserModel = {
    signUp: jest.fn(),
    verifyEmail: jest.fn(),
    forgetPassword: jest.fn(),
  };

  // mock auth services
  const mockAuthService = {
    login: jest.fn(),
    resendVerificationLink: jest.fn(),
    sendEmailVerificationToken: jest.fn(),
  };

  // mock jwt services
  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mocked-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule, DBModule],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'Inventors@2024',
        firstName: 'Test',
        lastName: 'User',
        joinMethod: RegistrationMethod.SIGN_UP,
      };

      const req = { user: { id: 'testId', email: 'test@example.com' } }; // Mock request
      const expectedResult = { ...mockUser, password: undefined };

      mockUserModel.signUp.mockResolvedValue(expectedResult);

      const result = await controller.register(req, createUserDto);

      expect(result).toEqual(expectedResult);
      expect(mockUserModel.signUp).toHaveBeenCalledWith(req, createUserDto);
    });
  });
});
