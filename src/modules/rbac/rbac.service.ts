import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { User } from '../users/entities/user.entity';
import { Enterprise } from '../enterprises/entities/enterprise.entity';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionsRepository: Repository<RolePermission>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Enterprise)
    private enterprisesRepository: Repository<Enterprise>,
  ) {}

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return [];

    const rolePermissions = await this.rolePermissionsRepository
      .createQueryBuilder('rp')
      .leftJoinAndSelect('rp.permission', 'permission')
      .where('rp.role = :role', { role: user.role })
      .getMany();

    return rolePermissions.map(rp => rp.permission.name);
  }

  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permissionName);
  }

  async canAccessEnterprise(userId: string, enterpriseId: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return false;

    // Admin can access everything
    if (user.role === 'ADMIN') return true;

    // Check if user owns the enterprise
    const enterprise = await this.enterprisesRepository.findOne({
      where: { id: enterpriseId },
    });

    if (enterprise?.ownerUserId === userId) return true;

    // Check if user is staff member
    const staffAccess = await this.enterprisesRepository
      .createQueryBuilder('enterprise')
      .leftJoin('enterprise.staff', 'staff')
      .where('enterprise.id = :enterpriseId', { enterpriseId })
      .andWhere('staff.userId = :userId', { userId })
      .getOne();

    return !!staffAccess;
  }

  async isAdmin(userId: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    return user?.role === 'ADMIN';
  }

  async isOwner(userId: string, enterpriseId: string): Promise<boolean> {
    const enterprise = await this.enterprisesRepository.findOne({
      where: { id: enterpriseId, ownerUserId: userId },
    });
    return !!enterprise;
  }
}