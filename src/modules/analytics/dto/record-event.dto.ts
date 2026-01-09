import { IsString, IsEnum, IsUUID, IsOptional } from 'class-validator';

export enum EventType {
  PAGE_VIEW = 'page_view',
  SEARCH_IMPRESSION = 'search_impression',
  CTA_CLICK = 'cta_click'
}

export class RecordEventDto {
  @IsUUID()
  enterpriseId: string;

  @IsEnum(EventType)
  eventType: EventType;

  @IsOptional()
  metadata?: any;
}