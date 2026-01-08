import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Enterprise } from '../../enterprises/entities/enterprise.entity';

@Entity('enterprise_analytics_daily')
@Unique(['enterpriseId', 'day'])
export class EnterpriseAnalyticsDaily {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'enterprise_id' })
  enterpriseId: string;

  @Column({ type: 'date' })
  day: Date;

  @Column({ name: 'page_views', default: 0 })
  pageViews: number;

  @Column({ name: 'search_impressions', default: 0 })
  searchImpressions: number;

  @Column({ name: 'cta_clicks', default: 0 })
  ctaClicks: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Enterprise, enterprise => enterprise.analytics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enterprise_id' })
  enterprise: Enterprise;
}