import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateLinkDto {
  @ApiProperty({
    description: 'user info',
    example: '60d9f4f0e3e8f6c15b9e2b7d'
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Position the user is applying for',
    example: 'Backend lead'
  })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({
    description: 'application status',
    example: 'pending'
  })
  @IsString()
  @IsOptional()
  status?: string;
}
