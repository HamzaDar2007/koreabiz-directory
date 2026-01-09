import { IsEnum, IsUUID } from 'class-validator';
import { SubscriptionTier } from '../../../common/enums/subscription-tier.enum';

export class ChangePlanDto {
  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @IsUUID()
  planId: string;
}