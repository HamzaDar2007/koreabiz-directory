import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../../modules/rbac/rbac.service';

@Injectable()
export class EnterpriseAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Admin can access everything
    if (await this.rbacService.isAdmin(user.id)) {
      return true;
    }

    // Get enterprise ID from params
    const enterpriseId = request.params.enterpriseId || request.params.id;
    
    if (!enterpriseId) {
      throw new ForbiddenException('Enterprise ID required');
    }

    // Check if user can access this enterprise
    const canAccess = await this.rbacService.canAccessEnterprise(user.id, enterpriseId);
    
    if (!canAccess) {
      throw new ForbiddenException('You do not have access to this enterprise');
    }

    return true;
  }
}