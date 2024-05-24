import { IsDefined, IsString, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserAddPhotoDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsDefined()
  photo: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDefined()
  @IsString()
  userId: string;
}
