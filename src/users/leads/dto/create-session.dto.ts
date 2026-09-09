import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { SchoolNames } from 'src/shared/schema';

export class CreateSchoolSessionDto {
  @ApiProperty({
    enum: SchoolNames,
    example: SchoolNames.OAUSTECH,
  })
  @IsNotEmpty()
  @IsEnum(SchoolNames)
  name: SchoolNames;

  @ApiProperty({
    example: '2026-08-01T00:00:00.000Z',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  startsAt: Date;

  @ApiProperty({
    example: '2027-08-31T23:59:59.999Z',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  endsAt: Date;
}
