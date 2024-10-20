import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Model, Types } from 'mongoose';
import { DBModule, User, UserDocument } from '../schema';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UserLoginDto } from '../dtos/user-login.dto';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { RegistrationMethod } from '../interfaces';

// Increase Jest timeout globally for this file
jest.setTimeout(15000);

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let userModel: Model<UserDocument>;

  const mockUser = {
    _id: new Types.ObjectId().toString(),
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashedPassword',
    role: 'user',
  };

  const mockUserModel = {
    signUp: jest.fn(),
    verifyEmail: jest.fn(),
    forgetPassword: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock_token'),
  };

  const mockAuthService = {
    login: jest.fn(),
    resendVerificationLink: jest.fn(),
    sendEmailVerificationToken: jest.fn(),
    generateToken: jest.fn().mockReturnValue({ access_token: 'mock_token' }),
  };

  beforeEach(async () => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [DBModule],
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

    // Set up global.jwtService for the auth service
    global.jwtService = mockJwtService;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    // it('should register a new user with valid password', async () => {
    //   const createUserDto: CreateUserDto = {
    //     email: 'test@example.com',
    //     password: 'Test123!@#',
    //     firstName: 'John',
    //     lastName: 'Doe',
    //     joinMethod: RegistrationMethod.SIGN_UP,
    //   };
    //   const req = { headers: {} };

    //   mockUserModel.signUp.mockResolvedValue(mockUser);

    //   // Add timeout and ensure promise resolution
    //   const result = await Promise.resolve(
    //     controller.register(req, createUserDto),
    //   );

    //   expect(mockUserModel.signUp).toHaveBeenCalledWith(req, createUserDto);
    //   expect(result).toEqual(mockUser);
    // }, 15000);

    it('should throw BadRequestException for invalid password', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'simple',
        firstName: 'John',
        lastName: 'Doe',
        joinMethod: RegistrationMethod.SIGN_UP,
      };
      const req = { headers: {} };

      mockUserModel.signUp.mockRejectedValue(
        new BadRequestException(
          'Password must contain a number, special character, alphabet both upper and lower cased, and must be at least of 6 letters.',
        ),
      );

      await expect(controller.register(req, createUserDto)).rejects.toThrow(
        BadRequestException,
      );
    }, 15000);
  });

  describe('login', () => {
    it('should login a user and return access token', async () => {
      const userLoginDto: UserLoginDto = {
        email: 'test@example.com',
        password: 'Test123!@#',
      };
      const req = { user: mockUser };
      const expectedResponse = {
        access_token: 'mock_token',
        ...mockUser,
      };

      mockAuthService.login.mockResolvedValue(expectedResponse);

      const result = await Promise.resolve(controller.login(req, userLoginDto));

      expect(mockAuthService.login).toHaveBeenCalledWith(req);
      expect(result).toEqual(expectedResponse);
    }, 15000);
  });

  // describe('verifyEmail', () => {
  //   it('should verify user email', async () => {
  //     const userId = new Types.ObjectId().toString();
  //     const token = 'verification_token';

  //     mockUserModel.verifyEmail.mockResolvedValue({ verified: true });

  //     const result = await Promise.resolve(
  //       controller.verifyEmail(userId, token),
  //     );

  //     expect(mockUserModel.verifyEmail).toHaveBeenCalledWith(userId, token);
  //     expect(result).toEqual({ verified: true });
  //   }, 15000);
  // });

  describe('resendVerification', () => {
    it('should resend verification email', async () => {
      const email = 'test@example.com';
      const req = { headers: {} };
      const expectedResponse = { message: 'Verification email sent' };

      mockAuthService.resendVerificationLink.mockResolvedValue(
        expectedResponse,
      );

      const result = await Promise.resolve(
        controller.resendVerification(req, email),
      );

      expect(mockAuthService.resendVerificationLink).toHaveBeenCalledWith(
        req,
        email,
      );
      expect(result).toEqual(expectedResponse);
    }, 15000);
  });

  describe('sendEmailVerificationToken', () => {
    it('should send email verification token with valid userId', async () => {
      const userId = new Types.ObjectId().toString();
      const req = { headers: {} };
      const expectedResponse = { message: 'Verification token sent' };

      mockAuthService.sendEmailVerificationToken.mockResolvedValue(
        expectedResponse,
      );

      const result = await Promise.resolve(
        controller.sendEmailVerificationToken(req, userId),
      );

      expect(mockAuthService.sendEmailVerificationToken).toHaveBeenCalledWith(
        req,
        userId,
      );
      expect(result).toEqual(expectedResponse);
    }, 15000);

    it('should throw error for invalid userId format', async () => {
      const userId = 'invalid-id';
      const req = { headers: {} };

      mockAuthService.sendEmailVerificationToken.mockRejectedValue(
        new Error('Invalid ObjectId'),
      );

      await expect(
        controller.sendEmailVerificationToken(req, userId),
      ).rejects.toThrow();
    }, 15000);
  });

  // describe('forgetPassword', () => {
  //   it('should handle forget password request', async () => {
  //     const email = 'test@example.com';
  //     const expectedResponse = { message: 'Reset password email sent' };

  //     mockUserModel.forgetPassword.mockResolvedValue(expectedResponse);

  //     const result = await Promise.resolve(controller.forgetPassword(email));

  //     expect(mockUserModel.forgetPassword).toHaveBeenCalledWith(email);
  //     expect(result).toEqual(expectedResponse);
  //   }, 15000);
  // });
});
