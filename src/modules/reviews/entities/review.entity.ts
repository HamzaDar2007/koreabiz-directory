import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, Check } from 'typeorm';
import { ReviewStatus } from '../../../common/enums/review-status.enum';
import { Enterprise } from '../../enterprises/entities/enterprise.entity';
import { User } from '../../users/entities/user.entity';

@Entity('reviews')
@Check('ck_reviews_rating', 'rating >= 1 AND rating <= 5')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'enterprise_id' })
  enterpriseId: string;

  @Column({ name: 'author_user_id', nullable: true })
  authorUserId: string;

  @Column({ name: 'author_name', nullable: true })
  authorName: string;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ nullable: true })
  comment: string;

  @Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.PENDING })
  status: ReviewStatus;

  @Column({ name: 'ip_hash', nullable: true })
  ipHash: string;

  @Column({ name: 'user_agent_hash', nullable: true })
  userAgentHash: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Relations
  @ManyToOne(() => Enterprise, enterprise => enterprise.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enterprise_id' })
  enterprise: Enterprise;

  @ManyToOne(() => User, user => user.reviews, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'author_user_id' })
  author: User;
}