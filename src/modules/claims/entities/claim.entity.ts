import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ClaimStatus } from '../../../common/enums/claim-status.enum';
import { Enterprise } from '../../enterprises/entities/enterprise.entity';
import { User } from '../../users/entities/user.entity';

@Entity('claims')
export class Claim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'enterprise_id' })
  enterpriseId: string;

  @Column({ name: 'requester_user_id', nullable: true })
  requesterUserId: string;

  @Column({ name: 'requester_name', nullable: true })
  requesterName: string;

  @Column({ name: 'requester_email', nullable: true })
  requesterEmail: string;

  @Column({ name: 'requester_phone', nullable: true })
  requesterPhone: string;

  @Column({ nullable: true })
  position: string;

  @Column({ name: 'proof_of_ownership', nullable: true })
  proofOfOwnership: string;

  @Column({ type: 'enum', enum: ClaimStatus, default: ClaimStatus.SUBMITTED })
  status: ClaimStatus;

  @Column({ name: 'reviewed_by_user_id', nullable: true })
  reviewedByUserId: string;

  @Column({ name: 'review_notes', nullable: true })
  reviewNotes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Relations
  @ManyToOne(() => Enterprise, enterprise => enterprise.claims, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enterprise_id' })
  enterprise: Enterprise;

  @ManyToOne(() => User, user => user.submittedClaims, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requester_user_id' })
  requester: User;

  @ManyToOne(() => User, user => user.reviewedClaims, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewed_by_user_id' })
  reviewer: User;
}