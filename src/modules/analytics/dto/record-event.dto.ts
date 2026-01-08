import { IsString, IsUUID, IsOptional, IsObject } from 'class-validator';

export class RecordEventDto {
  @IsString()
  eventType: string;

  @IsUUID()
  enterpriseId: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}