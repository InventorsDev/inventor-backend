import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { TempLeadRegistration, User, UserDocument } from 'src/shared/schema';
import { TempLeadnDto } from './dto/temp-lead.dto';
import { UsersService } from 'src/users/users.service';
import { ApplicationStatus, UserRole } from 'src/shared/interfaces';
import { format } from 'date-fns';
import { decrypt, encrypt } from 'src/shared/utils';

import { CreateUserDto } from 'src/shared/dtos/create-user.dto';
@Injectable()
export class LeadRegistrationService {
  private readonly baseUrl =
    'http://localhost:3888/docs/api/v1/lead-registrations'; // Base URL
  constructor(
    @Inject(User.name) private userModel: Model<UserDocument>, // Use @Inject with the model name
    @Inject(TempLeadRegistration.name)
    private readonly tempLeadModel: Model<TempLeadRegistration>,
    private readonly usersService: UsersService,
  ) {}

  // view single application
  async viewOneApplication(email: string): Promise<TempLeadRegistration> {
    const application = await this.tempLeadModel.findOne({ email }).exec();
    if (!application) {
      throw new NotFoundException(`Application with email ${email} not found`);
    }
    return application;
  }

  // view all lead applications
  async viewApplications(): Promise<TempLeadRegistration[]> {
    const L_Applications = await this.tempLeadModel.find();
    if (!L_Applications || L_Applications.length == 0) {
      throw new NotFoundException('No application data found!');
    }
    return L_Applications;
  }
  // create lead application for active user
  async createTempRegistration(
    tempLeadDto: TempLeadnDto,
  ): Promise<TempLeadRegistration> {
    const { email } = tempLeadDto;
    const u = await this.usersService.findByEmail(email);
    // TODO: set a time limit to user application
    const today = new Date();
    if (u.nextApplicationTime < today) {
      throw new BadRequestException(
        `The next time you can apply as a lead is ${format(u.nextApplicationTime, 'eeee, MMMM do, h:mm a')}`,
      );
    }

    const modifiedDto = {
      ...tempLeadDto,
      createdAt: new Date(),
      firstname: u.firstName,
      lastname: u.lastName,
    };

    // change next application to 3 months
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3);
    // update the user data that has to do with application
    await this.tempLeadModel.db.collection('users').updateOne(
      { email: email },
      {
        $set: {
          applicationStatus: ApplicationStatus.PENDING,
          nextAppliactionTime: futureDate,
        },
      },
    );
    console.log(`Email: ${email}\nUser: ${u}\nModified: ${modifiedDto}`);
    const newTempRegistration = new this.tempLeadModel(modifiedDto);
    return await newTempRegistration.save();
  }

  // approve a lead application
  async approveTempApplication(tempRegistrationId: string): Promise<string> {
    const tempRegistration = await this.tempLeadModel
      .findById(tempRegistrationId)
      .exec();
    if (!tempRegistration) {
      throw new NotFoundException(
        `Temp registration with ID ${tempRegistrationId} not found`,
      );
    }
    const u = await this.tempLeadModel.db
      .collection('users')
      .findOne({ email: tempRegistration.email });

    await this.tempLeadModel.db.collection('users').updateOne(
      { email: tempRegistration.email },
      {
        $set: {
          role: [UserRole.LEAD],
          leadPosition: tempRegistration.leadPosition,
          applicatonStatus: ApplicationStatus.APPROVED,
          // should also change user 'applicatonStatus'
        },
      },
    );
    // remove the temp data
    await this.removeTempApplication(tempRegistrationId);
    return `${u.firstName} has been verified as a lead for ${u.leadPosition}`;
  }
  async removeTempApplication(tempId: string): Promise<void> {
    await this.tempLeadModel.findByIdAndDelete(tempId).exec();
  }

  // reject a lead application
  async rejectTempApplication(tempRegistrationId: string): Promise<User> {
    const tempRegistration = await this.tempLeadModel
      .findById(tempRegistrationId)
      .exec();
    if (!tempRegistration) {
      throw new NotFoundException(
        `Temp registration with ID ${tempRegistrationId} not found`,
      );
    }
    // change the application status and delete the temp application
    const user = await this.userModel.findOneAndUpdate(
      { email: tempRegistration.email },
      { applicationStatus: ApplicationStatus.REJECTED },
      { new: true },
    );
    await this.removeTempApplication(tempRegistrationId);
    return user;
  }

  // generate encrypted links
  async generateUniqueLink(email: string): Promise<string> {
    const user = await this.userModel.findOne({ email: email });
    const preFilledParams = {
      userId: user ? user._id : '',
      email: email,
      firstName: user ? user.firstName : '',
      lastName: user ? user.lastName : '',
    };

    const queryString = new URLSearchParams(preFilledParams as any).toString();
    // console.log(`Query string: ${queryString}`);
    const encryptedParams = encrypt(queryString);
    // console.log(`Encrypted data: ${encryptedParams}\nEncoded data: ${encodeURIComponent(encryptedParams)}`);
    return `${this.baseUrl}/register?data=${encodeURIComponent(encryptedParams)}`;
  }

  // decode generated link
  paraseEncryptedParams(encryptedParams: string): {
    email: string;
    userId: string;
  } {
    const decryptedParams = decrypt(decodeURIComponent(encryptedParams));
    const [userId, email] = decryptedParams
      .split('&')
      .map((param) => param.split('=')[1]);
    return { userId, email };
  }

  // refrence reating a new user
  async createUser(userData: CreateUserDto) {
    return (this.userModel as any).signUp(userData);
  }

  // get all leads
  // decided to go the crude way since i couldn't get the one in userServices to work
  async getUsersWithLeadRole(): Promise<User[]> {
    const users = await this.userModel.find({ role: 'LEAD' }).exec();
    return users;
  }
}
