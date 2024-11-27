import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TestModule } from 'src/shared/testkits';
import { UsersAdminsController } from './users.admin.controller';
import { DBModule, User } from 'src/shared/schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserAddPhotoDto } from './dto/user-add-photo.dto';
import { TempLeadDto } from './dto/temp-lead.dto';
import { CreateUserDto } from 'src/shared/dtos/create-user.dto';
import { RequestReactivationDto } from './dto/request-reactivation.dto';
import { DeactivateAccountDto } from './dto/deactivate-account.dto';
import {
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ApiReq, userRoles, userStatuses } from 'src/shared/interfaces';
import { UserDocument } from 'src/shared/schema';

import {
  ApplicationStatus,
  RegistrationMethod,
  UserRole,
  UserStatus,
} from 'src/shared/interfaces';

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

  describe('RequestVerificationToken', () => {
    const mockReq: ApiReq = { user: { id: 'adminId' } }; // Mock request object
    const userId = 'validUserId';

    it('should successfully request verification', async () => {
      jest
        .spyOn(usersService, 'requestVerification')
        .mockResolvedValue(undefined);

      const result = await adminController.RequestVerificationToken(
        mockReq,
        userId,
      );

      expect(result).toBeUndefined(); // Updated to match the method behavior
      expect(usersService.requestVerification).toHaveBeenCalledWith(
        mockReq,
        userId,
      );
    });

    it('should throw an error if the user is not found', async () => {
      jest
        .spyOn(usersService, 'requestVerification')
        .mockRejectedValue(new Error('User not found'));

      await expect(
        adminController.RequestVerificationToken(mockReq, userId),
      ).rejects.toThrow('User not found');
      expect(usersService.requestVerification).toHaveBeenCalledWith(
        mockReq,
        userId,
      );
    });

    it('should handle verification request not allowed error', async () => {
      jest
        .spyOn(usersService, 'requestVerification')
        .mockRejectedValue(
          new Error('Verification request not allowed at this time'),
        );

      await expect(
        adminController.RequestVerificationToken(mockReq, userId),
      ).rejects.toThrow('Verification request not allowed at this time');
      expect(usersService.requestVerification).toHaveBeenCalledWith(
        mockReq,
        userId,
      );
    });

    it('should handle user already verified error', async () => {
      jest
        .spyOn(usersService, 'requestVerification')
        .mockRejectedValue(new Error('User is already verified'));

      await expect(
        adminController.RequestVerificationToken(mockReq, userId),
      ).rejects.toThrow('User is already verified');
      expect(usersService.requestVerification).toHaveBeenCalledWith(
        mockReq,
        userId,
      );
    });
  });

  describe('updateUserStatus', () => {
    const mockReq: any = { user: { id: 'adminId' } }; // Mock request object
    const userId = 'validUserId';
    const payload = { status: UserStatus.ACTIVE }; // Example payload

    it('should successfully update user status', async () => {
      const updatedUser = createUserMock({ status: UserStatus.ACTIVE }); // Mock updated user
      jest.spyOn(usersService, 'updateStatus').mockResolvedValue(updatedUser);

      const result = await adminController.updateUserStatus(
        mockReq,
        userId,
        payload,
      );

      expect(result).toEqual(updatedUser); // Assert the updated user is returned
      expect(usersService.updateStatus).toHaveBeenCalledWith(
        userId,
        UserStatus.ACTIVE,
      );
    });

    it('should throw an error if user is not found', async () => {
      jest
        .spyOn(usersService, 'updateStatus')
        .mockRejectedValue(new Error('User not found'));

      await expect(
        adminController.updateUserStatus(mockReq, userId, payload),
      ).rejects.toThrow('User not found');
      expect(usersService.updateStatus).toHaveBeenCalledWith(
        userId,
        UserStatus.ACTIVE,
      );
    });

    it('should throw an error for invalid status', async () => {
      jest
        .spyOn(usersService, 'updateStatus')
        .mockRejectedValue(new Error('Invalid status'));

      await expect(
        adminController.updateUserStatus(mockReq, userId, {
          status: 'INVALID_STATUS' as unknown as UserStatus,
        }),
      ).rejects.toThrow('Invalid status');
      expect(usersService.updateStatus).toHaveBeenCalledWith(
        userId,
        'INVALID_STATUS',
      );
    });
  });

  describe('getApplicationByEmail', () => {
    const email = 'test@example.com';

    it('should return a pending application', async () => {
      const pendingApplication = createUserDocumentMock({
        email,
        applicationStatus: ApplicationStatus.PENDING,
      });

      jest
        .spyOn(usersService, 'viewOneApplication')
        .mockResolvedValue(pendingApplication);

      const result = await adminController.getApplicationByEmail(email);

      expect(result).toEqual(pendingApplication);
      expect(usersService.viewOneApplication).toHaveBeenCalledWith(email);
    });

    it('should throw an error if no application is found', async () => {
      jest
        .spyOn(usersService, 'viewOneApplication')
        .mockRejectedValue(
          new NotFoundException(`Application with email ${email} not found`),
        );

      await expect(
        adminController.getApplicationByEmail(email),
      ).rejects.toThrow(`Application with email ${email} not found`);
      expect(usersService.viewOneApplication).toHaveBeenCalledWith(email);
    });

    it('should throw an error if the application is not pending', async () => {
      const nonPendingApplication = createUserMock({
        email,
        applicationStatus: ApplicationStatus.APPROVED,
      });

      jest
        .spyOn(usersService, 'viewOneApplication')
        .mockRejectedValue(
          new NotFoundException(`${email} has no pending application`),
        );

      await expect(
        adminController.getApplicationByEmail(email),
      ).rejects.toThrow(`${email} has no pending application`);
      expect(usersService.viewOneApplication).toHaveBeenCalledWith(email);
    });
  });

  describe('viewApplications', () => {
    it('should return a list of pending applications', async () => {
      const mockApplications = [
        createUserDocumentMock({
          email: 'applicant1@example.com',
          applicationStatus: ApplicationStatus.PENDING,
          leadPosition: 'Team Lead',
        }),
        createUserDocumentMock({
          email: 'applicant2@example.com',
          applicationStatus: ApplicationStatus.PENDING,
          leadPosition: 'Project Manager',
        }),
      ];

      jest
        .spyOn(usersService, 'viewApplications')
        .mockResolvedValue(mockApplications);

      const result = await adminController.viewApplications();

      expect(result).toEqual(mockApplications); // Verify the returned value matches the mock
      expect(usersService.viewApplications).toHaveBeenCalled(); // Verify the service method was called
    });

    it('should throw a NotFoundException if no applications are found', async () => {
      jest
        .spyOn(usersService, 'viewApplications')
        .mockRejectedValue(new NotFoundException('No application data found!'));

      await expect(adminController.viewApplications()).rejects.toThrow(
        'No application data found!',
      );
      expect(usersService.viewApplications).toHaveBeenCalled(); // Verify the service method was called
    });
  });

  describe('approveApplication', () => {
    const email = 'applicant@example.com';

    it('should successfully approve a lead application', async () => {
      const successMessage =
        'John Doe has been verified as a lead for TechCorp';

      jest
        .spyOn(usersService, 'approveTempApplication')
        .mockResolvedValue(successMessage);

      const result = await adminController.approveApplication(email);

      expect(result).toBe(successMessage); // Verify the returned message matches the mock
      expect(usersService.approveTempApplication).toHaveBeenCalledWith(email); // Verify the service method was called with the correct email
    });

    it('should throw a NotFoundException if the application is not found', async () => {
      jest
        .spyOn(usersService, 'approveTempApplication')
        .mockRejectedValue(
          new NotFoundException(`Application for ${email} not found`),
        );

      await expect(adminController.approveApplication(email)).rejects.toThrow(
        `Application for ${email} not found`,
      );
      expect(usersService.approveTempApplication).toHaveBeenCalledWith(email); // Verify the service method was called with the correct email
    });
  });

  describe('reject', () => {
    const email = 'applicant@example.com';
    const defaultMessage = 'Your application was rejected';

    it('should successfully reject a lead application with a default message', async () => {
      const successMessage = `${email} application has been rejected`;

      jest
        .spyOn(usersService, 'rejectTempApplication')
        .mockResolvedValue(successMessage);

      const result = await adminController.reject(email, { message: '' });

      expect(result).toBe(successMessage); // Verify the returned message matches the mock
      expect(usersService.rejectTempApplication).toHaveBeenCalledWith(
        email,
        defaultMessage,
      ); // Verify the service method was called with the correct arguments
    });

    it('should successfully reject a lead application with a custom message', async () => {
      const customMessage =
        'We regret to inform you that your application did not meet our criteria.';
      const successMessage = `${email} application has been rejected`;

      jest
        .spyOn(usersService, 'rejectTempApplication')
        .mockResolvedValue(successMessage);

      const result = await adminController.reject(email, {
        message: customMessage,
      });

      expect(result).toBe(successMessage); // Verify the returned message matches the mock
      expect(usersService.rejectTempApplication).toHaveBeenCalledWith(
        email,
        customMessage,
      ); // Verify the service method was called with the correct arguments
    });

    it('should throw a NotFoundException if the application is not found', async () => {
      jest
        .spyOn(usersService, 'rejectTempApplication')
        .mockRejectedValue(
          new NotFoundException(`Application for ${email} not found`),
        );

      await expect(
        adminController.reject(email, { message: '' }),
      ).rejects.toThrow(`Application for ${email} not found`);
      expect(usersService.rejectTempApplication).toHaveBeenCalledWith(
        email,
        defaultMessage,
      ); // Verify the service method was called
    });
  });

  describe('generateLink', () => {
    const email = 'applicant@example.com';

    it('should generate an invite link successfully', async () => {
      const mockLink = `https://example.com/invite-link?data=encryptedString`;

      jest.spyOn(usersService, 'inviteLead').mockResolvedValue(mockLink);

      const result = await adminController.generateLink(email);

      expect(result).toEqual({ link: mockLink }); // Verify the returned link matches the mock
      expect(usersService.inviteLead).toHaveBeenCalledWith(email); // Verify the service method was called with the correct email
    });

    it('should throw a NotFoundException if the user is not found', async () => {
      jest
        .spyOn(usersService, 'inviteLead')
        .mockRejectedValue(
          new NotFoundException(`User with email ${email} not found`),
        );

      await expect(adminController.generateLink(email)).rejects.toThrow(
        `User with email ${email} not found`,
      );
      expect(usersService.inviteLead).toHaveBeenCalledWith(email); // Verify the service method was called with the correct email
    });
  });
});

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            update: jest.fn().mockResolvedValue({
              _id: '123',
              firstName: 'John',
              lastName: 'Doe',
              userHandle: 'johndoe',
              roles: [UserRole.ADMIN],
              photo: 'https://example.com/avatar.jpg',
              age: 30,
              phone: '1234567890',
              gender: 'Male',
              deviceId: 'abc123',
              deviceToken: 'xyz456',
            }),
            addPhoto: jest.fn().mockResolvedValue({
              _id: '123',
              photo: 'https://cloudinary.com/photo.jpg',
            }),
            createTempRegistration: jest.fn(),
            createUser: jest.fn(),
            requestVerification: jest.fn(),
            deactivateAccount: jest.fn(),
            requestReactivation: jest.fn(),
            paraseEncryptedParams: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  describe('addPhoto', () => {
    it('should add a photo and return the updated user profile', async () => {
      const userId = '123';
      const photoUrl = 'https://cloudinary.com/photo.jpg';
      const payload: UserAddPhotoDto = { photo: photoUrl, userId };

      const req = { user: { _id: userId } } as any;

      const result = await controller.addPhoto(req, payload);

      expect(service.addPhoto).toHaveBeenCalledWith(userId, payload);
      expect(result).toEqual({
        _id: userId,
        photo: photoUrl,
      });
    });

    it('should throw ForbiddenException if user ID in payload does not match', async () => {
      const userId = '123';
      const photoUrl = 'https://cloudinary.com/photo.jpg';
      const payload: UserAddPhotoDto = {
        photo: photoUrl,
        userId: 'differentUserId',
      };

      const req = { user: { _id: userId } } as any;

      await expect(controller.addPhoto(req, payload)).rejects.toThrowError(
        ForbiddenException,
      );
    });
  });

  describe('createLead', () => {
    it('should successfully create a lead registration', async () => {
      const tempLeadDto: TempLeadDto = {
        email: 'test@example.com',
        leadPosition: 'Tech Lead',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: new Date(),
      };

      jest
        .spyOn(service, 'createTempRegistration')
        .mockResolvedValue('Application sent');

      const result = await controller.createLead(tempLeadDto);

      expect(service.createTempRegistration).toHaveBeenCalledWith(
        tempLeadDto.email,
        tempLeadDto.leadPosition,
      );
      expect(result).toBe('Application sent');
    });

    it('should throw BadRequestException if next application time is in the future', async () => {
      const tempLeadDto: TempLeadDto = {
        email: 'test@example.com',
        leadPosition: 'Tech Lead',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: new Date(),
      };

      jest
        .spyOn(service, 'createTempRegistration')
        .mockRejectedValue(
          new BadRequestException(
            'The next time you can apply as a lead is in the future',
          ),
        );

      await expect(controller.createLead(tempLeadDto)).rejects.toThrowError(
        BadRequestException,
      );
    });
  });

  describe('register (invite-link)', () => {
    it('should return the correct URL if user exists', async () => {
      const encryptedData = 'someEncryptedData';
      const parsedData = {
        userId: '507f1f77bcf86cd799439011',
        email: 'user@example.com',
      }; // Valid ObjectId string
      const userExists = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'), // Using a valid 24-character hex string
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        // Add any additional fields as required by your schema
      };

      jest.spyOn(service, 'paraseEncryptedParams').mockReturnValue(parsedData);
      jest.spyOn(service, 'findById').mockResolvedValue(userExists as any);

      const result = await controller.register(encryptedData);

      expect(service.paraseEncryptedParams).toHaveBeenCalledWith(encryptedData);
      expect(service.findById).toHaveBeenCalledWith(parsedData.userId);
      expect(result).toEqual({
        url: `/leads/createLead?email=${userExists.email}`,
      });
    });
  });

  it('should return the new user form URL if userId is missing', async () => {
    const encryptedData = 'someEncryptedData';
    const parsedData = { userId: '', email: 'newuser@example.com' };

    jest.spyOn(service, 'paraseEncryptedParams').mockReturnValue(parsedData);

    const result = await controller.register(encryptedData);

    expect(service.paraseEncryptedParams).toHaveBeenCalledWith(encryptedData);
    expect(result).toEqual({
      url: `/leads/new-user-form?${new URLSearchParams({
        email: parsedData.email,
      }).toString()}`,
    });
  });

  it('should throw NotFoundException if user does not exist', async () => {
    const encryptedData = 'someEncryptedData';
    const parsedData = { userId: '123', email: 'user@example.com' };

    jest.spyOn(service, 'paraseEncryptedParams').mockReturnValue(parsedData);
    jest
      .spyOn(service, 'findById')
      .mockRejectedValue(new NotFoundException('User Not found'));

    await expect(controller.register(encryptedData)).rejects.toThrowError(
      NotFoundException,
    );
    expect(service.paraseEncryptedParams).toHaveBeenCalledWith(encryptedData);
    expect(service.findById).toHaveBeenCalledWith(parsedData.userId);
  });

  it('should throw NotFoundException if the link is invalid', async () => {
    const encryptedData = 'invalidEncryptedData';

    jest.spyOn(service, 'paraseEncryptedParams').mockImplementation(() => {
      throw new Error('Invalid encryption');
    });

    await expect(controller.register(encryptedData)).rejects.toThrowError(
      NotFoundException,
    );
    expect(service.paraseEncryptedParams).toHaveBeenCalledWith(encryptedData);
  });

  describe('update', () => {
    it('should update a user', async () => {
      const userId = '123';
      const updateUserDto: UpdateUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        userHandle: 'johndoe',
        roles: [UserRole.ADMIN],
        photo: 'https://example.com/avatar.jpg',
        age: 30,
        phone: '1234567890',
        gender: 'Male',
        deviceId: 'abc123',
        deviceToken: 'xyz456',
        userId: '123',
      };

      const result = await controller.update(
        { user: { _id: '123' } },
        userId,
        updateUserDto,
      );

      expect(service.update).toHaveBeenCalledWith('123', updateUserDto);
      expect(result).toEqual({
        _id: '123',
        firstName: 'John',
        lastName: 'Doe',
        userHandle: 'johndoe',
        roles: [UserRole.ADMIN],
        photo: 'https://example.com/avatar.jpg',
        age: 30,
        phone: '1234567890',
        gender: 'Male',
        deviceId: 'abc123',
        deviceToken: 'xyz456',
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = '123';
      const updateUserDto: UpdateUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        userId: '123',
      };

      jest.spyOn(service, 'update').mockRejectedValue(new NotFoundException());

      await expect(
        controller.update({ user: { _id: '123' } }, userId, updateUserDto),
      ).rejects.toThrowError(NotFoundException);
    });
  });
  describe('newUserForm', () => {
    it('should successfully create a user and return the URL', async () => {
      const userData: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'strongPassword123',
        firstName: 'Jane',
        lastName: 'Doe',
        joinMethod: RegistrationMethod.SIGN_UP,
        location: {
          coordinates: [40.7128, -74.006],
          type: 'Point',
        },
        deviceId: 'device123',
        deviceToken: 'token123',
      };

      const createdUser = { email: userData.email };

      jest.spyOn(service, 'createUser').mockResolvedValue(createdUser);

      const result = await controller.newUserForm(userData);

      expect(service.createUser).toHaveBeenCalledWith(userData);
      expect(result).toEqual({
        url: `/leads/create?email=${createdUser.email}`,
      });
    });

    it('should throw InternalServerErrorException if user creation fails', async () => {
      const userData: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'strongPassword123',
        firstName: 'Jane',
        lastName: 'Doe',
        joinMethod: RegistrationMethod.SIGN_UP, // Using enum correctly
        location: {
          coordinates: [40.7128, -74.006],
          type: 'Point',
        },
        deviceId: 'device123',
        deviceToken: 'token123',
      };

      jest
        .spyOn(service, 'createUser')
        .mockRejectedValue(new Error('Failed to create user'));

      await expect(controller.newUserForm(userData)).rejects.toThrowError(
        InternalServerErrorException,
      );
      expect(service.createUser).toHaveBeenCalledWith(userData);
    });
  });
  describe('RequestVerificationToken', () => {
    it('should successfully request a verification token', async () => {
      const userId = '123';
      const req = { user: { _id: userId } } as any;

      jest.spyOn(service, 'requestVerification').mockResolvedValue(undefined);

      const result = await controller.RequestVerificationToken(req, userId);

      expect(service.requestVerification).toHaveBeenCalledWith(req, userId);
      expect(result).toBeUndefined();
    });

    it('should throw an error if user is not found', async () => {
      const userId = '123';
      const req = { user: { _id: userId } } as any;

      jest
        .spyOn(service, 'requestVerification')
        .mockRejectedValue(new NotFoundException('User not found'));

      await expect(
        controller.RequestVerificationToken(req, userId),
      ).rejects.toThrowError(NotFoundException);
      expect(service.requestVerification).toHaveBeenCalledWith(req, userId);
    });
  });
  describe('deactivateAccount', () => {
    it('should successfully deactivate the user account', async () => {
      const userId = '123';
      const payload: DeactivateAccountDto = { reason: 'No longer needed' };
      const req = { user: { _id: userId } } as any;

      type UserWithOptionalId = Partial<User> & { _id?: string };
      const deactivatedUser: UserWithOptionalId = {
        _id: userId,
        status: UserStatus.DEACTIVATED,
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'hashedPassword123',
        profileSummary: 'Sample profile summary',
      };

      jest
        .spyOn(service, 'deactivateAccount')
        .mockResolvedValue(deactivatedUser as User);

      const result = await controller.deactivateAccount(req, userId, payload);

      expect(service.deactivateAccount).toHaveBeenCalledWith(userId);
      expect(result).toEqual(deactivatedUser);
    });

    it('should throw NotFoundException if the user is not found', async () => {
      const userId = '123';
      const payload: DeactivateAccountDto = { reason: 'No longer needed' };
      const req = { user: { _id: userId } } as any;

      jest
        .spyOn(service, 'deactivateAccount')
        .mockRejectedValue(new NotFoundException('User not found'));

      await expect(
        controller.deactivateAccount(req, userId, payload),
      ).rejects.toThrowError(NotFoundException);
      expect(service.deactivateAccount).toHaveBeenCalledWith(userId);
    });
  });
  describe('requestReactivation', () => {
    it('should successfully reactivate the user account', async () => {
      const userId = '123';
      const payload: RequestReactivationDto = {
        message: 'Please reactivate my account',
      };

      type UserWithOptionalId = Partial<User> & { _id?: string };

      const reactivatedUser: UserWithOptionalId = {
        _id: userId,
        status: UserStatus.ACTIVE,
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      jest
        .spyOn(service, 'requestReactivation')
        .mockResolvedValue(reactivatedUser as User);

      const result = await controller.requestReactivation(userId, payload);

      expect(service.requestReactivation).toHaveBeenCalledWith(userId);
      expect(result).toEqual(reactivatedUser);
    });

    it('should throw NotFoundException if the user is not found', async () => {
      const userId = '123';
      const payload: RequestReactivationDto = {
        message: 'Please reactivate my account',
      };

      jest
        .spyOn(service, 'requestReactivation')
        .mockRejectedValue(new NotFoundException('User not found'));

      await expect(
        controller.requestReactivation(userId, payload),
      ).rejects.toThrowError(NotFoundException);
      expect(service.requestReactivation).toHaveBeenCalledWith(userId);
    });
  });
});

/*
'*generates a mock user object that can be used across multiple tests
 *choose which part you want to override using createMock({parameter:new_value})
*/

const createUserDocumentMock = (
  overrides: Partial<User> = {},
): UserDocument => {
  const baseUser = createUserMock(overrides); // Use your existing createUserMock function

  return {
    ...baseUser, // Include all the fields from createUserMock
    _id: new Types.ObjectId(), // Add Mongoose ObjectId
    save: jest.fn(), // Mock Mongoose Document methods
    validate: jest.fn(),
    remove: jest.fn(),
    populate: jest.fn(),
  } as unknown as UserDocument; // Cast to UserDocument type
};
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
