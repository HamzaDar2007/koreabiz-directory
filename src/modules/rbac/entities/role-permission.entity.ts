import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { Permission } from './permission.entity';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryColumn({ type: 'enum', enum: UserRole })
  role: UserRole;

  @PrimaryColumn({ name: 'permission_id' })
  permissionId: string;

  // Relations
  @ManyToOne(() => Permission, permission => permission.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}