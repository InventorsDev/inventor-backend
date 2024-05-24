import { Injectable, NotFoundException, BadRequestException} from '@nestjs/common';
import { CreateLeadRegistrationDto } from './dto/create-lead_registration.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Registration } from 'src/shared/schema/lead_registration.schema';
import { User, UserDocument } from '../shared/schema/user.schema';
import { NewUserLeadRegistrationDto } from './dto/new-user-lear-registration.dto';
import * as CryptoJS from 'crypto-js' //generate links
import { TempLeadRegistration } from 'src/shared/schema/temp_lead_registration.schema';
import { UserRole } from 'src/shared/interfaces';


@Injectable()
export class LeadRegistrationService {
  private readonly baseUrl = 'http://localhost:3888/docs/api/v1/lead-registrations'; // Base URL
  private readonly secretkey = "Inventors24" // secret key for encryptionand decryption

  constructor(
  @InjectModel(Registration.name) private registrationModel: Model<Registration>,
  @InjectModel(User.name) private userModel: Model<UserDocument>,
  @InjectModel(TempLeadRegistration.name) private tempLeadRegistrationModel: Model<TempLeadRegistration>,
  ){}

  // encrypt link
  encrypt(link: string): string { 
    return CryptoJS.AES.encrypt(link, this.secretkey).toString(); // convert the link to a random hash
  }

  // decrypt link
  decrypt(link: string): string{
    const bytes = CryptoJS.AES.decrypt(link, this.secretkey);
    return bytes.toString(CryptoJS.enc.Utf8); //standadize the string
  }

  //phrase encrypted data
  paraseEncryptedParams(encryptedParams: string): any {
    // decrypt the data and convert into an object url param
    const decryptParams = this.decrypt(encryptedParams)
    const params = new URLSearchParams(decryptParams)
    return {email: params.get('email'), userId: params.get('userId')}
  }

  //check if a user exists
  async userExists(userId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).exec();
    return !!user;
  }
  
  // find user by id
  async findUserById(userId: string): Promise<User>{
    const user = await this.userModel.findById(userId).exec()
    if(!user){throw new NotFoundException(`user with id ${userId} not found`)}
    return user;
  }

  // the create function retuns the user registration
  async create(userId: string, createLeadRegistrationDto: CreateLeadRegistrationDto): Promise<Registration>{
    let userExists = await this.userExists(userId);
    if (!userExists){
      throw new NotFoundException(`user with Id ${userId} not found`);
    }
    const newRegistration = new this.registrationModel({
        userId,
        role: createLeadRegistrationDto.role,
        createdAt: new Date(),});
    return await newRegistration.save();
  }

  // create new user and lead
  async createNewUserAndLead(newUserLeadDto: NewUserLeadRegistrationDto): Promise<Registration>{
    const newUser = new this.userModel({
      email: newUserLeadDto.email,
      password: newUserLeadDto.password,
      firstName: newUserLeadDto.firstName,
      lastName: newUserLeadDto.lastName,
      joinMethod: newUserLeadDto.joinMethod,
      location: newUserLeadDto.location,
      deviceId: newUserLeadDto.deviceId,
      deviceToken: newUserLeadDto.deviceToken,
    })
    const savedUser = await newUser.save()

    const newLead = new this.registrationModel({
      role: newUserLeadDto.role,
      lead_approved_status: newUserLeadDto.lead_approved_status,
      leadPosition: newUserLeadDto.leadPosition,
      userId: savedUser._id,
      email: savedUser.email,
    })
    return await newLead.save()
  }

  // view all applications
  async viewApplications(): Promise<Registration[]> {
    const L_Applications = await this.registrationModel.find();
    if (!L_Applications || L_Applications.length == 0) {
        throw new NotFoundException('No appliation data not found!');
    }
    return L_Applications;
  }

  // view single aplication
  async ViewOneApplicaiton(email:string): Promise<Registration>{
    const application = await this.registrationModel.findOne({email}).exec()
    if (!application){
      throw new NotFoundException(`no application with email: ${email} found`)
    }
    return application
  }

  // verify an application
  async approveTempApplication(tempRegistrationId: string): Promise<Registration>{

    const existingApplication =  await this.tempLeadRegistrationModel.findById(tempRegistrationId).exec()
    if (!existingApplication) {
      throw new NotFoundException(`Application for #${tempRegistrationId} not found`);
    }

     // check if usre exists
     const user = await this.userModel.findById(existingApplication.userId).exec();
     if (!user){throw new BadRequestException(`No user with id: ${existingApplication.userId} found.`)}
      // change user role to lead and save
    user.role = UserRole[existingApplication.role]
    await user.save();

    // set lead registration data
    const newRegistration = new this.registrationModel({
      userId: user._id,
      role: user.role,
      status: user.status,
      password: user.password,
      leadPosition: existingApplication.leadPosition,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: new Date(),
      socials: user.socials,
      currentCompany: user.currentCompany,
      jobTitle: user.jobTitle,
    })
    await newRegistration.save(); // save to the  updated data lead database
    await this.tempLeadRegistrationModel.findByIdAndDelete(tempRegistrationId).exec() // remove the rudundant data from database

    return newRegistration;
  }

  //generates and return the unique link
  async generateUniqueLink(email:string): Promise<string>{
     // confirm the emaail
    const user = await this.userModel.findOne({email: email});
    // store user variable
    const preFilledParams = {
      userId: user ? user._id : null,
      email: email,
      first_name: user ? user.firstName: null,
      last_name: user ? user.lastName: null,
      // other params can go here, but do we need others?
    };

    // convert the parmms
    const qureyString = new URLSearchParams(preFilledParams as any).toString();
    // encrypt the data
    const encryptedParams = this.encrypt(qureyString)
    return `${this.baseUrl}/register?data=${encodeURIComponent(encryptedParams)}`;
  }

  // store the temporary lead inforamtion
  async createTempRegistration(createLeadRegistrationDto: CreateLeadRegistrationDto): Promise<TempLeadRegistration>{
    const newTempRegistration = new this.tempLeadRegistrationModel(createLeadRegistrationDto)
    return await newTempRegistration.save()
  }
}
