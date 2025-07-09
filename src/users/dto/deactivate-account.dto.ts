import { IsNotEmpty, IsString } from 'class-validator';

export class DeactivateAccountDto {
  @IsNotEmpty()
  @IsString()
  reason: string;
}
