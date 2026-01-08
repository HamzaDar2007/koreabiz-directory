import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { SubscriptionTier } from '../../../common/enums/subscription-tier.enum';
import { Enterprise } from '../../enterprises/entities/enterprise.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'enterprise_id', unique: true })
  enterpriseId: string;

  @Column({ type: 'enum', enum: SubscriptionTier, default: SubscriptionTier.FREE })
  tier: SubscriptionTier;

  @Column({ default: 'ACTIVE' })
  status: string;

  @Column({ name: 'current_period_start', nullable: true })
  currentPeriodStart: Date;

  @Column({ name: 'current_period_end', nullable: true })
  currentPeriodEnd: Date;

  @Column({ nullable: true })
  provider: string;

  @Column({ name: 'provider_customer_id', nullable: true })
  providerCustomerId: string;

  @Column({ name: 'provider_subscription_id', nullable: true })
  providerSubscriptionId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => Enterprise, enterprise => enterprise.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enterprise_id' })
  enterprise: Enterprise;
}