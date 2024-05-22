import { Injectable, NotFoundException, Logger, BadRequestException} from '@nestjs/common';
import { CreateLeadRegistrationDto } from './dto/create-lead_registration.dto';
import { UpdateLeadRegistrationDto } from './dto/update-lead_registration.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Registration } from './schemas/lead_registration.schema';
import { User, UserDocument } from '../shared/schema/user.schema';

//generate links
import { v4 as uuidv4 } from 'uuid';
import { PreFilledRegistrationDto } from './dto/pre-filled-lead_registration.dto';

@Injectable()
export class LeadRegistrationService {

  // private readonly logger = new Logger(LeadRegistrationService.name);
  private readonly baseUrl = 'http://localhost:3888/docs/api/v1/lead-registrations'; // Update with your base URL

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
        status: createLeadRegistrationDto.status || 'pending',
        createdAt: new Date(),
      }
    );
    console.log(newRegistration)
    return await newRegistration.save();
  }

  async viewApplications(): Promise<Registration[]> {
    
    const L_Applications = await this.registrationModel.find();
    if (!L_Applications || L_Applications.length == 0) {
        throw new NotFoundException('No appliation data not found!');
    }
    return L_Applications;
  }

  async approveApplication(userId: string, updateLeadRegistrationDto: UpdateLeadRegistrationDto): Promise<Registration>{
    const existingApplication =  await this.registrationModel.findOneAndUpdate({userId}, {updateLeadRegistrationDto}, {new:true})
    if (!existingApplication) {
      throw new NotFoundException(`Application for #${userId} not found`);
    }
    try{
      await this.updateUserRole(userId, updateLeadRegistrationDto.role);
      return existingApplication;
    }catch (error){
      console.error(`Error saving the new user role: ${error.message}`, error.stack);
      throw new BadRequestException('Error saving user data'); 
    }
    
  }

  //update user role
  async updateUserRole(userId: string, newRole: string): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      // this.logger.error(`User with ID ${userId} not found`);
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    user.role.concat[newRole] //update the use role
    await user.save();
    console.log(`User role updated successfully for userId: ${userId} to role: ${newRole}`);
    return user;
  }

  //generate unique links
  generateUniqueLink(userId: string, role: string, status: string, preFilledParams: PreFilledRegistrationDto): string {
    console.log('unique link gets called')
    const uniqueId = uuidv4();
    const queryParams = new URLSearchParams({userId, role, status, ...preFilledParams as any}).toString();
    console.log(`Genreated link: ${this.baseUrl}?id=${uniqueId}&${queryParams}`);
    return `${this.baseUrl}?id=${uniqueId}&${queryParams}`;
  }
}
