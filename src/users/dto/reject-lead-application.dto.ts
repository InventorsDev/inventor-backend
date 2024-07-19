import { ApiProperty } from '@nestjs/swagger';

export class RejectApplicationDto {
  @ApiProperty({ required: false, description: 'Rejection message' })
  message?: string;
}
