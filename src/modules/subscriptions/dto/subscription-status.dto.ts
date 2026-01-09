import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { SubscriptionTier } from '../../../common/enums/subscription-tier.enum';

export class SubscriptionStatusDto {
  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @IsString()
  status: string;

  @IsOptional()
  @IsDateString()
  currentPeriodStart?: string;

  @IsOptional()
  @IsDateString()
  currentPeriodEnd?: string;
}