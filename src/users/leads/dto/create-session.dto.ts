import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty } from 'class-validator';
import { SchoolNames } from 'src/shared/schema';

export class createSchoolSessionDto {
  @IsNotEmpty()
  @IsEnum(SchoolNames)
  name: SchoolNames;

  @IsNotEmpty()
  @IsDate()
  startsAt: Date;

  @IsNotEmpty()
  @IsDate()
  endsAt: Date;
}
