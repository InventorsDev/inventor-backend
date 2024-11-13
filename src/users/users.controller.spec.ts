import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtUsersGuard } from 'src/shared/auth/guards/jwt.users.guard';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from 'src/shared/dtos/create-user.dto';
import { UserChangePasswordDto } from './dto/user-change-password.dto';
import { TempLeadDto } from './dto/temp-lead.dto';
import { RequestReactivationDto } from './dto/request-reactivation.dto';
import { RegistrationMethod } from 'src/shared/interfaces';

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
});
