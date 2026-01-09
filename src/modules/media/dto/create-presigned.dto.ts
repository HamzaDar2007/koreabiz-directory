import { IsString, IsEnum, IsOptional, IsInt, Min, IsNotEmpty } from 'class-validator';
import { MediaKind } from '../../../common/enums/media-kind.enum';

export enum MediaType {
  LOGO = 'LOGO',
  GALLERY = 'GALLERY'
}

export class CreatePresignedDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  fileType: string;

  @IsString()
  @IsNotEmpty()
  contentType: string;

  @IsInt()
  @Min(1)
  fileSize: number;

  @IsEnum(MediaType)
  mediaType: MediaType;
}