import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  JoinMethod,
  Location,
  SocialsLinks,
} from '../../shared/interfaces/event.type';

export class EventDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shortDesc: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  host: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  coHost?: string[];

  @ApiProperty({ enum: Location })
  @IsNotEmpty()
  @IsEnum(Location)
  location: Location;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiProperty({ enum: JoinMethod })
  @IsNotEmpty()
  @IsEnum(JoinMethod)
  joinMethod: JoinMethod;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  socialsLinks?: SocialsLinks;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  eventDate: string;
}
