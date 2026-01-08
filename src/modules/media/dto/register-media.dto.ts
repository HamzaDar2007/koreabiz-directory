import { IsString, IsUUID, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { MediaType } from './create-presigned.dto';

export class RegisterMediaDto {
  @IsOptional()
  @IsUUID()
  enterpriseId: string;

  @IsString()
  key: string;

  @IsEnum(MediaType)
  mediaType: MediaType;

  @IsString()
  contentType: string;

  @IsNumber()
  fileSize: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}