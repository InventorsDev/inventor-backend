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
import { Model, Document, Types } from 'mongoose';

describe('UsersAdminController', () => {
  let controller: UsersController;
  let adminController: UsersAdminsController;
  let usersService: UsersService;
  let userModel: Model<UserDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule, DBModule],
      controllers: [UsersController, UsersAdminsController],
      providers: [UsersService],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    adminController = module.get<UsersAdminsController>(UsersAdminsController);
    usersService = module.get<UsersService>(UsersService);
    userModel = module.get<Model<UserDocument>>(User.name);
  });

  describe('userInvite', () => {
    const inviteDto = {
      email: 'test@example.com',
      role: UserRole.USER,
    };

    it('should successfully invite a user', async () => {
      const expectedResult = { message: 'Invitation sent successfully' };
      jest.spyOn(usersService, 'userInvite').mockResolvedValue(expectedResult);

      const result = await adminController.userInvite(inviteDto);

      expect(result).toEqual(expectedResult);
      expect(usersService.userInvite).toHaveBeenCalledWith(inviteDto);
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
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const userId = new Types.ObjectId().toString();
      const expectedResult = { message: 'User deleted successfully' };
      
      jest.spyOn(usersService, 'remove').mockResolvedValue(expectedResult);

      const result = await adminController.remove(userId);

      expect(result).toEqual(expectedResult);
      expect(usersService.remove).toHaveBeenCalledWith(userId);
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };
      const mockReq = { user: createUserMock() };
      const expectedUser = createUserMock(createUserDto);

      jest.spyOn(userModel, 'signUp').mockResolvedValue(expectedUser);

      const result = await adminController.createUser(mockReq, createUserDto);

      expect(result).toEqual(expectedUser);
      expect(userModel.signUp).toHaveBeenCalledWith(mockReq, createUserDto);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const userId = new Types.ObjectId().toString();
      const updateDto = {
        firstName: 'Updated',
        lastName: 'Name',
      };
      const mockReq = { user: createUserMock() };
      const expectedResult = createUserMock(updateDto);

      jest.spyOn(usersService, 'update').mockResolvedValue(expectedResult);

      const result = await adminController.update(mockReq, userId, updateDto);

      expect(result).toEqual(expectedResult);
      expect(usersService.update).toHaveBeenCalledWith(userId, updateDto);
    });
  });

  describe('addPhoto', () => {
    it('should add a photo to user profile', async () => {
      const userId = new Types.ObjectId().toString();
      const photoDto = {
        userId,
        photo: 'new-photo-url.jpg',
      };
      const mockReq = { user: createUserMock() };
      const expectedResult = createUserMock({ photo: photoDto.photo });

      jest.spyOn(usersService, 'addPhoto').mockResolvedValue(expectedResult);

      const result = await adminController.addPhoto(mockReq, userId, photoDto);

      expect(result).toEqual(expectedResult);
      expect(usersService.addPhoto).toHaveBeenCalledWith(photoDto.userId, photoDto);
    });
  });

  describe('forgetPassword', () => {
    it('should initiate forget password process', async () => {
      const email = 'test@example.com';
      const expectedResult = { message: 'Reset password email sent' };

      jest.spyOn(userModel, 'forgetPassword').mockResolvedValue(expectedResult);

      const result = await adminController.forgetPassword(email);

      expect(result).toEqual(expectedResult);
      expect(userModel.forgetPassword).toHaveBeenCalledWith(email);
    });
  });

  describe('verifyEmail', () => {
    it('should verify user email', async () => {
      const userId = new Types.ObjectId().toString();
      const token = 'verification-token';
      const expectedResult = { message: 'Email verified successfully' };

      jest.spyOn(userModel, 'verifyEmail').mockResolvedValue(expectedResult);

      const result = await adminController.verifyEmail(userId, token);

      expect(result).toEqual(expectedResult);
      expect(userModel.verifyEmail).toHaveBeenCalledWith(userId, token);
    });
  });

  describe('RequestVerificationToken', () => {
    it('should request new verification token', async () => {
      const userId = new Types.ObjectId().toString();
      const mockReq = { user: createUserMock() };
      const expectedResult = { message: 'Verification email sent' };

      jest.spyOn(usersService, 'requestVerification').mockResolvedValue(expectedResult);

      const result = await adminController.RequestVerificationToken(mockReq, userId);

      expect(result).toEqual(expectedResult);
      expect(usersService.requestVerification).toHaveBeenCalledWith(mockReq, userId);
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status', async () => {
      const userId = new Types.ObjectId().toString();
      const statusDto = { status: UserStatus.ACTIVE };
      const mockReq = { user: createUserMock() };
      const expectedResult = createUserMock({ status: UserStatus.ACTIVE });

      jest.spyOn(usersService, 'updateStatus').mockResolvedValue(expectedResult);

      const result = await adminController.updateUserStatus(mockReq, userId, statusDto);

      expect(result).toEqual(expectedResult);
      expect(usersService.updateStatus).toHaveBeenCalledWith(userId, statusDto.status);
    });
  });

  describe('Lead application endpoints', () => {
    describe('getApplicationByEmail', () => {
      it('should find an application by email', async () => {
        const email = 'lead@example.com';
        const expectedResult = createUserMock({ email });

        jest.spyOn(usersService, 'viewOneApplication').mockResolvedValue(expectedResult);

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

        jest.spyOn(usersService, 'viewApplications').mockResolvedValue(expectedResults);

        const result = await adminController.viewApplications();

        expect(result).toEqual(expectedResults);
        expect(usersService.viewApplications).toHaveBeenCalled();
      });
    });

    describe('approveApplication', () => {
      it('should approve a lead application', async () => {
        const email = 'lead@example.com';
        const expectedResult = 'Application approved successfully';

        jest.spyOn(usersService, 'approveTempApplication').mockResolvedValue(expectedResult);

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

        jest.spyOn(usersService, 'rejectTempApplication').mockResolvedValue(expectedResult);

        const result = await adminController.reject(email, rejectDto);

        expect(result).toEqual(expectedResult);
        expect(usersService.rejectTempApplication).toHaveBeenCalledWith(
          email,
          rejectDto.message
        );
      });

      it('should reject with default message when no message provided', async () => {
        const email = 'lead@example.com';
        const rejectDto = {};
        const expectedResult = 'Application rejected successfully';

        jest.spyOn(usersService, 'rejectTempApplication').mockResolvedValue(expectedResult);

        const result = await adminController.reject(email, rejectDto);

        expect(result).toEqual(expectedResult);
        expect(usersService.rejectTempApplication).toHaveBeenCalledWith(
          email,
          'Your application was rejected'
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

        jest.spyOn(usersService, 'getUsersWithLeadRole').mockResolvedValue(expectedResults);

        const result = await adminController.getUsersWithLeadRole();

        expect(result).toEqual(expectedResults);
        expect(usersService.getUsersWithLeadRole).toHaveBeenCalled();
      });
    });
  });
});