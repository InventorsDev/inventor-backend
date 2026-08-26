import { IsEmail, IsEnum, IsNotEmpty, IsUUID } from "class-validator";
import { LeadAssignmentPositions } from "src/shared/schema";

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
    @IsUUID()
    sessionId: string;

    @IsNotEmpty()
    @IsEnum(LeadAssignmentPositions)
    position: LeadAssignmentPositions;

}