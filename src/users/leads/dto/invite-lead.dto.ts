import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { LeadAssignmentPositions } from 'src/shared/schema';

/**
 "email": "john@example.com",
  "sessionId": "...",
  "position": "BACKEND_LEAD"
 */
export class InviteLeadDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  sessionId: string;

  @IsNotEmpty()
  @IsEnum(LeadAssignmentPositions)
  position: LeadAssignmentPositions;
}
