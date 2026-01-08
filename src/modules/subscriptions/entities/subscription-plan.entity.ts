import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SubscriptionTier } from '../../../common/enums/subscription-tier.enum';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: SubscriptionTier, unique: true })
  tier: SubscriptionTier;

  @Column({ name: 'gallery_limit' })
  galleryLimit: number;

  @Column({ name: 'featured_listing', default: false })
  featuredListing: boolean;

  @Column({ default: false })
  analytics: boolean;

  @Column({ name: 'priority_support', default: false })
  prioritySupport: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}