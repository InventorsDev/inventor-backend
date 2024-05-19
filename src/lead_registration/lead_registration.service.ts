import { Injectable, NotFoundException, Logger} from '@nestjs/common';
import { CreateLeadRegistrationDto } from './dto/create-lead_registration.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Registration } from './schemas/lead_registration.schema';
import { User, UserDocument } from '../shared/schema/user.schema';

@Injectable()
export class LeadRegistrationService {

  // private readonly logger = new Logger(LeadRegistrationService.name);

  constructor(
  @InjectModel(Registration.name) private registrationModel: Model<Registration>,
  @InjectModel(User.name) private userModel: Model<UserDocument>
  ){}

  async userExists(userId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).exec();
    return !!user;
  }

  
  // the create function retuns the user registration
  async create(userId: string, createLeadRegistrationDto: CreateLeadRegistrationDto): Promise<Registration>{
    // adding logging
    // this.logger.log(`Creating registration for userId: ${userId}, role: ${CreateLeadRegistrationDto.role}`);

    // should have user verification logic here
    // ie userExists = true;
    let userExists = await this.userExists(userId);
    // if (userExists) {console.log("User exists")}

    if (!userExists){
      // this.logger.error(`User with ID ${userId} not found`);
      // throw error
      throw new NotFoundException(`user with Id ${userId} not found`);
    }
    // save registration infor
    const newRegistration = new this.registrationModel(
      {
        userId,
        role: createLeadRegistrationDto.role,
        status: createLeadRegistrationDto.status,
        createdAt: new Date(),
      }
    );
    console.log(newRegistration)
    return await newRegistration.save();
  }
}
