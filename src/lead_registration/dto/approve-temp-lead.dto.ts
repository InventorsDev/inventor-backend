import { IsNotEmpty, IsString } from 'class-validator';

export class ApproveTempLeadDto {
  @IsString()
  @IsNotEmpty()
  readonly tempRegistrationId: string;
}
