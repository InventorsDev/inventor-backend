import { BadRequestException } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsEmail, IsOptional, IsNotEmpty, IsDefined, ValidateIf, IsIn } from "class-validator";
import { LocationDto } from "src/shared/dtos/location.dto";
import { registrationMethods, RegistrationMethod, UserRole } from "src/shared/interfaces";
export class NewUserLeadRegistrationDto{
  // user information
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ enumName: 'UserRegistrationType', enum: registrationMethods })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @ValidateIf((data) => {
    if (!registrationMethods.includes(data.joinMethod)) {
      throw new BadRequestException('Please supply a valid sign up options');
    }
    return true;
  })
  joinMethod: RegistrationMethod;

  @ApiProperty({ type: LocationDto })
  @IsNotEmpty()
  @IsOptional()
  location?: LocationDto;

  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  deviceToken?: string;

  //  lead info
  @IsString()
  @IsNotEmpty()
  role: UserRole.LEAD;

  // @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsIn(['pending', 'approved', 'rejected'])
  lead_approved_status: 'pending';

  @ApiProperty({example: "frontend_1 || backend_2 ||..."})
  @IsString()
  @IsNotEmpty()
  leadPosition: string;

  @IsString()
  @IsNotEmpty()
  createdAt: Date
}