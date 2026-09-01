import { IsDate, IsEnum, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { SchoolNames } from 'src/shared/schema';

export class CreateSchoolSessionDto {
  @IsNotEmpty()
  @IsEnum(SchoolNames)
  name: SchoolNames;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  startsAt: Date;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  endsAt: Date;
}
