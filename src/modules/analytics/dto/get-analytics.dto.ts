import { IsUUID, IsOptional, IsDateString } from 'class-validator';

export class GetAnalyticsDto {
  @IsUUID()
  enterpriseId: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}