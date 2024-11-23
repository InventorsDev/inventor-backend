import { IsString, IsOptional, IsDate, IsEnum, IsArray } from 'class-validator';
import { Status } from '../../shared/interfaces/post.type';

export class UpdatePostDto {
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
  postDate?: Date;
}
