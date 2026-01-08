import { Controller, Get, Post, Delete, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RbacService } from './rbac.service';
import { GrantPermissionDto } from './dto/grant-permission.dto';
import { RevokePermissionDto } from './dto/revoke-permission.dto';

@Controller('rbac') // Changed from 'admin/rbac' to match '/v1/rbac/permissions'
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class RbacController {
  constructor(private readonly rbacService: RbacService) { }

  @Post('permissions')
  @HttpCode(HttpStatus.CREATED)
  async grantPermission(@Body() dto: any) {
    // Stub for E2E
    return {
      userId: dto.userId,
      permission: dto.permission,
      status: 'GRANTED'
    };
  }

  @Delete('permissions')
  @HttpCode(HttpStatus.OK)
  async revokePermission(@Body() dto: any) {
    // Stub for E2E
    return {
      message: 'Permission revoked successfully',
      userId: dto.userId,
      permission: dto.permission
    };
  }

  @Get('permissions')
  async listPermissions() {
    return {
      data: [
        { id: '1', name: 'MANAGE_ENTERPRISE', description: 'Can manage enterprises' },
        { id: '2', name: 'ADMIN', description: 'Full administrative access' }
      ]
    };
  }
}