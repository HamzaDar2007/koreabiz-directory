import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Enterprise } from './enterprise.entity';

@Entity('enterprise_closed_days')
@Unique(['enterpriseId', 'closedDate'])
export class EnterpriseClosedDay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'enterprise_id' })
  enterpriseId: string;

  @Column({ name: 'closed_date', type: 'date' })
  closedDate: Date;

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Enterprise, enterprise => enterprise.closedDays, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enterprise_id' })
  enterprise: Enterprise;
}