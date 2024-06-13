import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { TempLeadRegistration, User, UserDocument } from 'src/shared/schema';
import { TempLeadnDto } from './dto/temp-lead.dto';
import { UsersService } from 'src/users/users.service';
import { UserRole } from 'src/shared/interfaces';
@Injectable()
export class LeadRegistrationService {
  constructor(
    @Inject(User.name) private userModel: Model<UserDocument>, // Use @Inject with the model name
    @Inject(TempLeadRegistration.name)
    private readonly tempLeadModel: Model<TempLeadRegistration>,
    private readonly usersService: UsersService,
  ) {}
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
    const modifiedDto = {
      ...tempLeadDto,
      createdAt: new Date(),
      firstname: u.firstName,
      lastname: u.lastName,
    };
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
}
