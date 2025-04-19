import { IsString, IsOptional, IsDate, IsEnum, IsArray } from 'class-validator';
import { Status } from '../../../shared/interfaces/postcomment.type';

export class UpdatePostCommentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  shortDesc?: string;

  @IsOptional()
  @IsString()
  description?: string;

  
  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsDate()
  PostCommentDate?: Date;
}
