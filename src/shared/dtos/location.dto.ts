import { ApiProperty } from '@nestjs/swagger';

export class LocationDto {
  @ApiProperty({ type: 'string', example: 'Point' })
  type: string;

  @ApiProperty({ type: 'array', example: ['longitude', 'latitude'] })
  coordinates: number[];
}
