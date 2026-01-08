import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique, Check } from 'typeorm';
import { Enterprise } from './enterprise.entity';

@Entity('enterprise_hours')
@Unique(['enterpriseId', 'dayOfWeek'])
@Check('ck_hours_day_of_week', 'day_of_week >= 0 AND day_of_week <= 6')
export class EnterpriseHours {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'enterprise_id' })
  enterpriseId: string;

  @Column({ name: 'day_of_week', type: 'smallint' })
  dayOfWeek: number;

  @Column({ name: 'is_closed', default: false })
  isClosed: boolean;

  @Column({ name: 'open_time', type: 'time', nullable: true })
  openTime: string;

  @Column({ name: 'close_time', type: 'time', nullable: true })
  closeTime: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Enterprise, enterprise => enterprise.hours, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enterprise_id' })
  enterprise: Enterprise;
}