import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { TempLeadRegistration, User, UserDocument } from 'src/shared/schema';

@Injectable()
export class LeadRegistrationService {
  constructor(
    @Inject(User.name) private userModel: Model<UserDocument>,  // Use @Inject with the model name
    @Inject(TempLeadRegistration.name) private readonly tempLeadModel: Model<TempLeadRegistration>,
  ) {}

  async viewApplications(): Promise<TempLeadRegistration[]> {
    const L_Applications = await this.tempLeadModel.find();
    if (!L_Applications || L_Applications.length == 0) {
      throw new NotFoundException('No application data found!');
    }
    return L_Applications;
  }
}