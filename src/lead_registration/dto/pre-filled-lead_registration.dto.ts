import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PreFilledRegistrationDto {
  @ApiProperty({
    description: 'user info',
    example: 'userId'
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'application status',
    example: 'pending'
  })
  @IsString()
  @IsOptional() 
  @IsIn(['pending', 'approved', 'rejected'])
  status?: string;
  
  @ApiProperty({
    description: 'Position the user is applying for',
    example: 'Backend lead'
  })
  @IsString()
  @IsOptional()
  role?: string;
}
