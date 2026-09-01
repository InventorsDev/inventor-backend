import {
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { LeadAssignmentPositions } from 'src/shared/schema';

export class LeadAssignmentCreateDto {
  @IsNotEmpty()
  @IsMongoId({ message: 'userId must be a valid MongoDB ObjectId' })
  userId: string;

  @IsNotEmpty()
  @IsMongoId({ message: 'categoryId must be a valid MongoDB ObjectId' })
  sessionId?: string;

  @IsNotEmpty()
  @IsEnum(LeadAssignmentPositions)
  position: LeadAssignmentPositions;

  @IsNotEmpty()
  @IsMongoId({ message: 'userId must be a valid MongoDB ObjectId' })
  appointedBy: string;

  @IsNotEmpty()
  @IsDate()
  endsAt: Date;
}
