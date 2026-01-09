import { IsString, IsEnum, IsOptional, IsInt, Min, IsNotEmpty } from 'class-validator';
import { MediaKind } from '../../../common/enums/media-kind.enum';

export class RegisterMediaDto {
  @IsEnum(MediaKind)
  kind: MediaKind;

  @IsEnum(MediaKind)
  mediaType: MediaKind;

  @IsString()
  @IsNotEmpty()
  storageKey: string;

  @IsString()
  @IsNotEmpty()
  key: string;

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  bytes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  fileSize?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  height?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}