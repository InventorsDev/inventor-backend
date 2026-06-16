import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  JoinMethod,
  Location,
  SocialsLinks,
} from '../../shared/interfaces/event.type';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  shortDesc?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  host?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  coHost?: string[];

  @IsOptional()
  @IsEnum(Location)
  location?: Location;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsEnum(JoinMethod)
  joinMethod?: JoinMethod;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  socialsLinks?: SocialsLinks;

  @IsOptional()
  @IsDateString()
  eventDate?: string;
}
