import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany, ManyToMany, JoinColumn, JoinTable } from 'typeorm';
import { EnterpriseStatus } from '../../../common/enums/enterprise-status.enum';
import { User } from '../../users/entities/user.entity';
import { City } from '../../cities/entities/city.entity';
import { Category } from '../../categories/entities/category.entity';
import { EnterpriseHours } from './enterprise-hours.entity';
import { EnterpriseClosedDay } from './enterprise-closed-day.entity';
import { EnterpriseMedia } from './enterprise-media.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Claim } from '../../claims/entities/claim.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { EnterpriseAnalyticsDaily } from '../../analytics/entities/enterprise-analytics-daily.entity';
import { Favorite } from '../../favorites/entities/favorite.entity';
import { EnterpriseStaff } from './enterprise-staff.entity';

@Entity('enterprises')
export class Enterprise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ name: 'legal_name', nullable: true })
  legalName: string;

  @Column({ name: 'short_description', nullable: true })
  shortDescription: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  verified: boolean;

  @Column({ name: 'owner_user_id', nullable: true })
  ownerUserId: string;

  @Column({ name: 'city_id', nullable: true })
  cityId: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ name: 'rating_avg', type: 'decimal', precision: 2, scale: 1, default: 0.0 })
  ratingAvg: number;

  @Column({ name: 'rating_count', default: 0 })
  ratingCount: number;

  @Column({ name: 'price_range', type: 'smallint', nullable: true })
  priceRange: number;

  @Column({ name: 'founded_year', type: 'smallint', nullable: true })
  foundedYear: number;

  @Column({ name: 'employee_range', nullable: true })
  employeeRange: string;

  @Column({ type: 'enum', enum: EnterpriseStatus, default: EnterpriseStatus.ACTIVE })
  status: EnterpriseStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.ownedEnterprises, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'owner_user_id' })
  owner: User;

  @ManyToOne(() => City, city => city.enterprises, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'city_id' })
  city: City;

  @ManyToMany(() => Category, category => category.enterprises)
  @JoinTable({
    name: 'enterprise_categories',
    joinColumn: { name: 'enterprise_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' }
  })
  categories: Category[];

  @OneToMany(() => EnterpriseHours, hours => hours.enterprise)
  hours: EnterpriseHours[];

  @OneToMany(() => EnterpriseClosedDay, closedDay => closedDay.enterprise)
  closedDays: EnterpriseClosedDay[];

  @OneToMany(() => EnterpriseMedia, media => media.enterprise)
  media: EnterpriseMedia[];

  @OneToMany(() => Review, review => review.enterprise)
  reviews: Review[];

  @OneToMany(() => Claim, claim => claim.enterprise)
  claims: Claim[];

  @OneToMany(() => Subscription, subscription => subscription.enterprise)
  subscriptions: Subscription[];

  @OneToMany(() => EnterpriseAnalyticsDaily, analytics => analytics.enterprise)
  analytics: EnterpriseAnalyticsDaily[];

  @OneToMany(() => Favorite, favorite => favorite.enterprise)
  favorites: Favorite[];

  @OneToMany(() => EnterpriseStaff, staff => staff.enterprise)
  staff: EnterpriseStaff[];
}