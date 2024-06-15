import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { JoinMethod, SocialsLinks, Location} from '../../shared/interfaces/event.type';

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
  @IsOptional()
  host?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
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
  @IsOptional()
  @IsString()
  link: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  socialsLinks: SocialsLinks;

  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  eventDate: Date;
}
