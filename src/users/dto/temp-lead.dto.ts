import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TempLeadDto {
  @ApiProperty({ example: 'frontend_1 || backend_2 ||...' })
  @IsString()
  @IsNotEmpty()
  leadPosition: string;
}
