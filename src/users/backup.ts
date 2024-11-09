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

  
  });
});