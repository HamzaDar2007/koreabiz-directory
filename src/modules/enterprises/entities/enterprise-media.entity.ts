import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MediaKind } from '../../../common/enums/media-kind.enum';
import { Enterprise } from './enterprise.entity';

@Entity('enterprise_media')
export class EnterpriseMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'enterprise_id' })
  enterpriseId: string;

  @Column({ type: 'enum', enum: MediaKind })
  kind: MediaKind;

  @Column({ name: 'storage_key' })
  storageKey: string;

  @Column({ name: 'content_type', nullable: true })
  contentType: string;

  @Column({ type: 'bigint', nullable: true })
  bytes: number;

  @Column({ nullable: true })
  width: number;

  @Column({ nullable: true })
  height: number;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Relations
  @ManyToOne(() => Enterprise, enterprise => enterprise.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enterprise_id' })
  enterprise: Enterprise;
}