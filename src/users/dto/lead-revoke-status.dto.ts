import { IsNotEmpty, IsString } from 'class-validator';

export class LeadRevokeReasonDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
