import { Injectable, NotFoundException} from '@nestjs/common';
import { CreateLeadRegistrationDto } from './dto/create-lead_registration.dto';
@Injectable()
export class LeadRegistrationService {
  private registrations = [] // should have database logic here?
  
  // the create function retuns the user registration
  create(userId: string, CreateLeadRegistrationDto: CreateLeadRegistrationDto){
    // should have user verification logic here
    // ie userExists = true;
    let userExists = function verifyfunc(){return true} // this should be the functions

    if (!userExists){
      // throw error
      throw new NotFoundException(`user with Id ${userId} not found`);
    }
    const newRegistration = {
      id: this.registrations.length+1, 
      userId, 
      applicationId: CreateLeadRegistrationDto.applicationId,
      createdAt: new Date(),
    };
    this.registrations.push(newRegistration)
    return newRegistration
  }
}
