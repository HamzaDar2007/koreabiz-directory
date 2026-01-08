import { IsEnum, IsDateString, IsUUID } from 'class-validator';

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export class SubscriptionStatusDto {
  @IsUUID()
  planId: string;

  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus;

  @IsDateString()
  expiresAt: string;
}