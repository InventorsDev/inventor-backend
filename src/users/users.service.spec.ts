import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { TestModule } from 'src/shared/testkits';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../shared/schema';
import { BcryptUtil } from 'src/shared/utils';
import { RegistrationMethod, UserRole } from 'src/shared/interfaces';

describe('UsersService', () => {
  let usersService: UsersService;
  let userModel: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();

    userModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(), // what are we counting here
    };

    usersService = module.get<UsersService>(UsersService);
  });

  describe('userInvite', () => {
    it('should crate a user invite and return the user object', async () => {
      const payload = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: [UserRole.ADMIN], // Ensure 'ADMIN' is a valid UserRole
        joinMethod: RegistrationMethod.INVITATION, // Correct casing
        photo: 'path/to/photo.jpg', // Optional but can be included
        age: 30, // Optional but can be included
        phone: '1234567890', // Optional but can be included
        gender: 'Male', // Optional but can be included
      };
      const createUser = {
        _id: 'someId',
        ...payload,
        password: 'hashed password',
      };

      jest
        .spyOn(BcryptUtil, 'generateHash')
        .mockResolvedValue('hashed_password');
      userModel.create.mockResolvedValue(createUser);
      const ressult = await usersService.userInvite(payload);

      expect(ressult).toEqual(createUser);
      expect(BcryptUtil.generateHash).toHaveBeenCalled();
      expect(userModel.create).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        role: ['ADMIN'],
        emailVerification: true,
        password: 'hashed_password',
      });
    });
  });
});
