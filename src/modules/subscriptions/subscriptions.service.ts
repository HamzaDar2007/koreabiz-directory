import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { ChangePlanDto } from './dto/change-plan.dto';
import { SubscriptionTier } from '../../common/enums/subscription-tier.enum';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private plansRepository: Repository<SubscriptionPlan>,
  ) { }

  async changePlan(enterpriseId: string, dto: ChangePlanDto) {
    const plan = await this.plansRepository.findOne({ where: { id: dto.planId } });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    let subscription = await this.subscriptionsRepository.findOne({
      where: { enterpriseId },
    });

    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (!subscription) {
      subscription = this.subscriptionsRepository.create({
        enterpriseId,
        tier: plan.tier,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: thirtyDaysFromNow,
      });
    } else {
      subscription.tier = plan.tier;
      subscription.status = 'ACTIVE';
      subscription.currentPeriodStart = new Date();
      subscription.currentPeriodEnd = thirtyDaysFromNow;
    }

    return this.subscriptionsRepository.save(subscription);
  }

  async getStatus(enterpriseId: string) {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { enterpriseId },
      relations: ['enterprise'],
    });

    if (!subscription) {
      const freePlan = await this.plansRepository.findOne({ where: { tier: SubscriptionTier.FREE } });
      return {
        tier: SubscriptionTier.FREE,
        status: 'INACTIVE',
        currentPeriodEnd: null,
        features: this.getPlanFeatures(SubscriptionTier.FREE),
      };
    }

    return {
      tier: subscription.tier,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString(),
      features: this.getPlanFeatures(subscription.tier),
    };
  }

  async getAllPlans() {
    return this.plansRepository.find({
      order: { tier: 'ASC' },
    });
  }

  async checkFeatureAccess(enterpriseId: string, feature: string): Promise<boolean> {
    const status = await this.getStatus(enterpriseId);

    if (status.status !== 'ACTIVE') {
      return false;
    }

    const features = status.features as any;
    return features[feature] === true || (typeof features[feature] === 'number' && (features[feature] === -1 || features[feature] > 0));
  }

  async getFeatureLimit(enterpriseId: string, feature: string): Promise<number> {
    const status = await this.getStatus(enterpriseId);
    const features = status.features as any;
    return features[feature] || 0;
  }

  private getPlanFeatures(tier: SubscriptionTier) {
    const features = {
      [SubscriptionTier.FREE]: {
        galleryImages: 3,
        featuredListing: false,
        analytics: false,
        prioritySupport: false,
      },
      [SubscriptionTier.BASIC]: {
        galleryImages: 10,
        featuredListing: false,
        analytics: false,
        prioritySupport: false,
      },
      [SubscriptionTier.PRO]: {
        galleryImages: 30,
        featuredListing: true,
        analytics: true,
        prioritySupport: false,
      },
      [SubscriptionTier.ENTERPRISE]: {
        galleryImages: -1, // unlimited
        featuredListing: true,
        analytics: true,
        prioritySupport: true,
      },
    };

    return features[tier] || features[SubscriptionTier.FREE];
  }
}