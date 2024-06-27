
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserStatus } from 'src/shared/interfaces';

export class UpdateUserStatusDto {
  @IsNotEmpty()
  @IsEnum(UserStatus, { message: 'Status must be a valid enum value' })
  status: UserStatus;
}
