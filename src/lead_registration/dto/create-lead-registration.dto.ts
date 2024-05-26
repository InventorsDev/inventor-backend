import { IsString, IsIn, IsNotEmpty, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/shared/interfaces';

export class CreateLeadRegistrationDto{
  // @ApiProperty()
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

  @ApiProperty({example: "example@mail.com"})
  @IsNotEmpty()
  @IsEmail()
  email: string;

  // @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  // @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

}