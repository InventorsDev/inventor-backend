import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { JoinMethod, SocialsLinks, Location, Status} from '../../shared/interfaces/event.type';

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
  host?: string;

  @ApiProperty()
  @IsNotEmpty()
  coHost?: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEnum(Location)
  location: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  photo?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEnum(JoinMethod)
  joinMethod?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  link: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  socialsLinks: SocialsLinks;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  eventDate: Date;
}
