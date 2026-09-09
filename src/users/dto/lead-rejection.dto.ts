import { IsNotEmpty, IsString } from 'class-validator';

export class LeadRejectionDTO {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
