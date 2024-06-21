import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { TempLeadRegistration, User, UserDocument } from 'src/shared/schema';
import { UsersService } from 'src/users/users.service';
import { ApplicationStatus, UserRole } from 'src/shared/interfaces';
import { format } from 'date-fns';
import { decrypt, encrypt } from 'src/shared/utils';

import { CreateUserDto } from 'src/shared/dtos/create-user.dto';
@Injectable()
export class LeadRegistrationService {
  private readonly baseUrl = 'http://localhost:3888/docs/api/v1/leads'; // Base URL
  constructor(
    @Inject(User.name) private userModel: Model<UserDocument>, // Use @Inject with the model name
    @Inject(TempLeadRegistration.name)
    private readonly tempLeadModel: Model<TempLeadRegistration>,
    private readonly usersService: UsersService,
  ) {}

  // view single application
  async viewOneApplication(email: string): Promise<UserDocument> {
    const application = await this.userModel.findOne({ email }).exec();
    if (!application) {
      throw new NotFoundException(`Application with email ${email} not found`);
    }
    if (application.applicationStatus == ApplicationStatus.PENDING) {
      return application;
    }
    throw new NotFoundException(`${email} has no pendign application`);
  }

  // view all lead applications
  async viewApplications(): Promise<UserDocument[]> {
    const leadApplications = await this.userModel
      .find({ applicationStatus: ApplicationStatus.PENDING })
      .exec();
    if (!leadApplications) {
      throw new NotFoundException('No application data found!');
    }
    return leadApplications;
  }

  // create lead application for active user
  async createTempRegistration(email: string): Promise<string> {
    const u = await this.usersService.findByEmail(email);
    // check the next application time
    const today = new Date();
    if (u.nextApplicationTime < today) {
      throw new BadRequestException(
        `The next time you can apply as a lead is ${format(u.nextApplicationTime, 'eeee, MMMM do, h:mm a')}`,
      );
    }

    // create next application date
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3);

    // update the user data that has to do with application
    try {
      await this.userModel.findOneAndUpdate(
        { email: email },
        {
          $set: {
            applicationStatus: ApplicationStatus.PENDING,
            nextAppliactionTime: futureDate,
            // need to pass in a lead position here
            leadPosition: 'lead position',
          },
        },
      );
    } catch {
      return 'Error updating user';
    }
    console.log(
      `Email: ${email}\nUser: ${u}\nUser status: ${u.applicationStatus}`,
    );
    return 'Application sent';
  }

  // approve a lead application
  async approveTempApplication(email: string): Promise<string> {
    const userApplication = await this.userModel
      .findOne({
        email: email,
        applicationStatus: ApplicationStatus.PENDING,
      })
      .exec();
    if (!userApplication) {
      throw new NotFoundException(`Application for ${email} not found`);
    }
    await this.tempLeadModel.db.collection('users').updateOne(
      { email: email },
      {
        $set: {
          role: [UserRole.LEAD],
          applicatonStatus: ApplicationStatus.APPROVED,
          // should also change user 'applicatonStatus'
        },
      },
    );
    userApplication.role = [UserRole.LEAD];
    userApplication.applicationStatus = ApplicationStatus.APPROVED;
    userApplication.save();

    return `${userApplication.firstName} has been verified as a lead for ${userApplication.leadPosition}`;
  }

  // to be deleted
  async removeTempApplication(tempId: string): Promise<void> {
    await this.tempLeadModel.findByIdAndDelete(tempId).exec();
  }

  // reject a lead application
  async rejectTempApplication(email: string): Promise<User> {
    const userApplication = this.viewOneApplication(email);
    (await userApplication).leadPosition = '';
    (await userApplication).applicationStatus = ApplicationStatus.REJECTED;
    (await userApplication).save();

    //send rejection email here;
    return userApplication;
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
    return `${this.baseUrl}/invite-link?data=${encodeURIComponent(encryptedParams)}`;
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

  // refrence routing a new user
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
