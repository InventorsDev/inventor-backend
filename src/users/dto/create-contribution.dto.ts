export class CreateContributionDTO {}
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { LeadContributionType } from 'src/shared/schema';

export class CreateLeadContributionDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsEnum(LeadContributionType)
  @IsNotEmpty()
  type: LeadContributionType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, string>;

  @IsDateString()
  @IsNotEmpty()
  occourredAt: string;
}
