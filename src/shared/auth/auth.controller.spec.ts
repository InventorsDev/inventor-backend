import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { RegistrationMethod, UserRole, UserStatus } from '../interfaces';
import {
  BasicInfo,
  BasicInfoDoc,
  ContactInfo,
  ContactInfoDocs,
  ProfessionalInfo,
  ProfessionalInfoDocs,
  User,
  UserDocument,
} from '../schema';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

// extending mongoose model ot allow us to use custom mocks
// used jest.mock becasue i'll mock them in the test
interface UserModel extends Model<UserDocument> {
  verifyEmail: jest.Mock;
  signUp: jest.Mock;
  forgetPassword: jest.Mock;
  generateUserHandle: jest.Mock;
  sendEmailVerificationToken: jest.Mock;
}
interface MockModels {
  BasicInfoModel: Partial<Model<BasicInfoDoc>>;
  ProfessionalInfoModel: Partial<Model<ProfessionalInfoDocs>>;
  ContactInfoModel: Partial<Model<ContactInfoDocs>>;
}

// requiered to tell typescript which methods we are mocking
// if removed, things like "authserice.resendverificationlink.mockRejectedValues" will not work
interface MockAuthService {
  login: jest.Mock;
  resendVerificationLink: jest.Mock;
  sendEmailVerificationToken: jest.Mock;
  findByUsername: jest.Mock;
  validateUser: jest.Mock;
}

// Main test container
describe('AuthController', () => {
  let authController: AuthController;
  let userModel: UserModel;
  let authService: MockAuthService;
  let jwtService: JwtService;

  // Mock data for typical user object
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    userHandle: 'johndoe',
    emailVerification: false,
    joinMethod: RegistrationMethod.SIGN_UP,
    role: [UserRole.ADMIN],
    status: UserStatus.ACTIVE,
  };

  // mock a typical Http request object
  const mockReq = {
    protocol: 'http',
    get: jest.fn().mockReturnValue('localhost'),
    originalUrl: '/api/v1/auth',
    query: {},
  };

  // to avoid conflict like services calling redis and db static functions, mocked
  // services are defined here
  const mockAuthService: MockAuthService = {
    login: jest.fn().mockImplementation((req) => {
      return Promise.resolve({
        access_token: 'mock_token', // will be what is returned as the token
        ...mockUser,
      });
    }),
    resendVerificationLink: jest.fn().mockImplementation((req, email) => {
      return Promise.resolve({
        message: 'Verification email sent successfully',
      });
    }),
    sendEmailVerificationToken: jest.fn().mockImplementation((req, userId) => {
      return Promise.resolve({
        emailVerificationCode: '123456',
        emailVerificationUrl: 'http://localhost/verify/123456',
      });
    }),
    findByUsername: jest.fn(),
    validateUser: jest.fn(),
  };
  // mock for the static methods in the user schema
  const mockUserModel = {
    verifyEmail: jest
      .fn()
      .mockImplementation((userId: string, token: string) => {
        if (token === '123456') {
          return Promise.resolve({
            status: 200,
            message: 'Email Verification Successful',
          });
        }
        return Promise.reject(
          new BadRequestException('Invalid email verification token supplied'),
        );
      }),

    signUp: jest
      .fn()
      .mockImplementation((req: any, createUserDto: any, sso = false) => {
        return Promise.resolve({
          ...mockUser,
          ...createUserDto,
          emailVerificationCode: '123456',
          emailVerificationUrl: 'http://localhost/verify/123456',
        });
      }),

    forgetPassword: jest.fn().mockImplementation((email: string) => {
      if (email === 'john@example.com') {
        return Promise.resolve({
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
        });
      }
      return Promise.reject(
        new BadRequestException('Email supplied cannot be found'),
      );
    }),

    sendEmailVerificationToken: jest.fn().mockImplementation((req, userId) => {
      return Promise.resolve({
        emailVerificationCode: '123456',
        emailVerificationUrl: 'http://localhost/verify/123456',
      });
    }),

    // Base mongoose model methods
    generateUserHandle: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  } as unknown as UserModel; // bypass typescript type checking || i know... but it works

  // ensure that the jwt always returns the same token
  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock_token'),
  };

  const mockBasicInfoModel: Partial<Model<BasicInfoDoc>> = {};
  const mockProfessionalInfoModel: Partial<Model<ProfessionalInfoDocs>> = {};
  const mockContactInfoModel: Partial<Model<ContactInfoDocs>> = {};

  beforeEach(async () => {
    jest.clearAllMocks(); // clear all mock implementaions

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: User.name,
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: BasicInfo.name,
          useValue: mockBasicInfoModel,
        },
        {
          provide: ProfessionalInfo.name,
          useValue: mockProfessionalInfoModel,
        },
        {
          provide: ContactInfo.name,
          useValue: mockContactInfoModel,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    userModel = module.get<UserModel>(User.name);
    authService = module.get<MockAuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  // check if controller is created
  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  // test for registration
  describe('register', () => {
    // basic user registration request
    interface CreateUserDto {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      joinMethod: RegistrationMethod;
    }

    const createUserDto: CreateUserDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'Password123!',
      joinMethod: RegistrationMethod.SIGN_UP,
    };

    it('should register a new user', async () => {
      const result = await authController.register(mockReq, createUserDto);

      expect(result).toHaveProperty('email', createUserDto.email);
      expect(userModel.signUp).toHaveBeenCalledWith(
        mockReq,
        createUserDto,
        false,
        {
          BasicInfoModel: mockBasicInfoModel,
          ProfessionalInfoModel: mockProfessionalInfoModel,
          ContactInfoModel: mockContactInfoModel,
        },
      );
    });

    it('should throw an error if user already exists', async () => {
      userModel.signUp.mockRejectedValueOnce(
        new BadRequestException('User already exists'),
      );

      await expect(
        authController.register(mockReq, createUserDto),
      ).rejects.toThrow(BadRequestException);
    });
    it('should throw an error if registration data is invalid', async () => {
      const invalidUserDto = {
        ...createUserDto,
        email: 'invalid-email', // Invalid email format
      };

      userModel.signUp.mockRejectedValueOnce(
        new BadRequestException('Invalid email format'),
      );

      await expect(
        authController.register(mockReq, invalidUserDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // test for login
  describe('login', () => {
    const loginDto = {
      email: 'john@example.com',
      password: 'Password123!',
    };

    it('should login successfully', async () => {
      const mockReqWithUser = {
        ...mockReq,
        user: mockUser,
      };

      const result = await authController.login(mockReqWithUser, loginDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('email', mockUser.email);
      expect(authService.login).toHaveBeenCalledWith(mockReqWithUser);
    });

    it('should include user details in response', async () => {
      const mockReqWithUser = {
        ...mockReq,
        user: mockUser,
      };

      const result = await authController.login(mockReqWithUser, loginDto);

      expect(result).toMatchObject({
        access_token: expect.any(String),
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      });
    });
  });

  describe('verifyEmail', () => {
    const userId = '507f1f77bcf86cd799439011';
    const validToken = '123456';
    const invalidToken = 'invalid-token';

    it('should verify email with valid token', async () => {
      const result = await authController.verifyEmail(userId, validToken);

      expect(result).toEqual({
        status: 200,
        message: 'Email Verification Successful',
      });
      expect(userModel.verifyEmail).toHaveBeenCalledWith(userId, validToken);
    });

    it('should throw BadRequestException for invalid token', async () => {
      await expect(
        authController.verifyEmail(userId, invalidToken),
      ).rejects.toThrow(BadRequestException);
      expect(userModel.verifyEmail).toHaveBeenCalledWith(userId, invalidToken);
    });

    it('should handle non-existent user ID', async () => {
      const nonExistentUserId = 'non-existent-id';
      userModel.verifyEmail.mockRejectedValueOnce(
        new BadRequestException('User not found'),
      );

      await expect(
        authController.verifyEmail(nonExistentUserId, validToken),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resendVerification', () => {
    const validEmail = 'john@example.com';
    const invalidEmail = 'nonexistent@example.com';

    it('should resend verification email successfully', async () => {
      const expectedResponse = {
        message: 'Verification email sent successfully',
      };

      const result = await authController.resendVerification(
        mockReq,
        validEmail,
      );

      expect(result).toEqual(expectedResponse);
      expect(authService.resendVerificationLink).toHaveBeenCalledWith(
        mockReq,
        validEmail,
      );
    });

    it('should handle non-existent email', async () => {
      authService.resendVerificationLink.mockRejectedValueOnce(
        new BadRequestException(
          `Account with email ${invalidEmail} does not exist`,
        ),
      );

      await expect(
        authController.resendVerification(mockReq, invalidEmail),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('sendEmailVerificationToken', () => {
    const userId = '507f1f77bcf86cd799439011';

    it('should send email verification token successfully', async () => {
      const expectedResponse = {
        emailVerificationCode: '123456',
        emailVerificationUrl: 'http://localhost/verify/123456',
      };

      const result = await authController.sendEmailVerificationToken(
        mockReq,
        userId,
      );

      expect(result).toEqual(expectedResponse);
      expect(authService.sendEmailVerificationToken).toHaveBeenCalledWith(
        mockReq,
        userId,
      );
    });

    it('should handle invalid user ID', async () => {
      const invalidUserId = 'invalid-user-id';
      authService.sendEmailVerificationToken.mockRejectedValueOnce(
        new BadRequestException('User not found'),
      );

      await expect(
        authController.sendEmailVerificationToken(mockReq, invalidUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgetPassword', () => {
    const validEmail = 'john@example.com';
    const invalidEmail = 'nonexistent@example.com';

    it('should process forget password request for valid email', async () => {
      const result = await authController.forgetPassword(validEmail);

      expect(result).toMatchObject({
        email: validEmail,
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(userModel.forgetPassword).toHaveBeenCalledWith(validEmail);
    });

    it('should throw BadRequestException for non-existent email', async () => {
      await expect(authController.forgetPassword(invalidEmail)).rejects.toThrow(
        BadRequestException,
      );
      expect(userModel.forgetPassword).toHaveBeenCalledWith(invalidEmail);
    });

    it('should handle error during password reset process', async () => {
      userModel.forgetPassword.mockRejectedValueOnce(
        new Error('Failed to process password reset'),
      );

      await expect(authController.forgetPassword(validEmail)).rejects.toThrow(
        Error,
      );
    });
  });
});
