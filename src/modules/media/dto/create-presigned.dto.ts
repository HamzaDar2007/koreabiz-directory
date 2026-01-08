import { IsString, IsEnum, IsUUID, IsOptional } from 'class-validator';

export enum MediaType {
  LOGO = 'LOGO',
  GALLERY = 'GALLERY'
}

export class CreatePresignedDto {
  @IsOptional()
  @IsUUID()
  enterpriseId: string;

  @IsString()
  fileName: string;

  @IsString()
  contentType: string;

  @IsEnum(MediaType)
  mediaType: MediaType;
}