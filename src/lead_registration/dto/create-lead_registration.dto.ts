import { IsString, IsIn, IsNotEmpty, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLeadRegistrationDto{
  @ApiProperty({
    description: 'Position the user is applying for',
    example: 'Backend lead'
  })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({
    description: 'status of registration', 
    example: 'pending',
    enum: ['pending', 'approved', 'rejected']
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['pending', 'approved', 'rejected'])
  lead_approved_status: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  leadPosition: string;

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

}