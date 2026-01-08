import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { StaffRole } from '../../../common/enums/staff-role.enum';
import { Enterprise } from './enterprise.entity';
import { User } from '../../users/entities/user.entity';

@Entity('enterprise_staff')
@Unique(['enterpriseId', 'userId'])
export class EnterpriseStaff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'enterprise_id' })
  enterpriseId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: StaffRole, default: StaffRole.VIEWER })
  role: StaffRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Enterprise, enterprise => enterprise.staff, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enterprise_id' })
  enterprise: Enterprise;

  @ManyToOne(() => User, user => user.staffAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}