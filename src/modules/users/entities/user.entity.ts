import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { Enterprise } from '../../enterprises/entities/enterprise.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Claim } from '../../claims/entities/claim.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';
import { Favorite } from '../../favorites/entities/favorite.entity';
import { EnterpriseStaff } from '../../enterprises/entities/enterprise-staff.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ name: 'password_hash', nullable: true })
  passwordHash: string;

  @Column({ name: 'display_name', nullable: true })
  displayName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Relations
  @OneToMany(() => Enterprise, enterprise => enterprise.owner)
  ownedEnterprises: Enterprise[];

  @OneToMany(() => Review, review => review.author)
  reviews: Review[];

  @OneToMany(() => Claim, claim => claim.requester)
  submittedClaims: Claim[];

  @OneToMany(() => Claim, claim => claim.reviewer)
  reviewedClaims: Claim[];

  @OneToMany(() => AuditLog, auditLog => auditLog.actor)
  auditLogs: AuditLog[];

  @OneToMany(() => Favorite, favorite => favorite.user)
  favorites: Favorite[];

  @OneToMany(() => EnterpriseStaff, staff => staff.user)
  staffAssignments: EnterpriseStaff[];
}