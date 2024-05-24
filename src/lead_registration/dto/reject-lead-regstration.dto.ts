import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString,  } from "class-validator";

export class RejectLeadRegistrationDto{
  @ApiProperty({description: 'Rejection message',
    example: 'The application does not meet the requirments'
  })
  @IsNotEmpty()
  @IsString()
  message: string;
}