import { IsNotEmpty, IsString } from 'class-validator';

export class RequestReactivationDto {
  @IsNotEmpty()
  @IsString()
  message: string;
}