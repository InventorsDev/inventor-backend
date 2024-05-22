import {IsString, IsIn, IsNotEmpty } from 'class-validator';
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
  status: string;
}