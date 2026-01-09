import { Controller, Get, Delete, Query, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { AuditService } from './audit.service';
import { ListAuditLogsDto } from './dto/list-audit-logs.dto';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AuditController {
  constructor(private readonly auditService: AuditService) { }

  @Get('logs')
  async list(@Query() dto: ListAuditLogsDto) {
    const [logs, total] = await this.auditService.list(dto);
    const page = Number(dto.page || 1);
    const limit = Number(dto.limit || 20);
    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get('logs/:id')
  async findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }

  @Delete('logs/:id')
  async remove(@Param('id') id: string) {
    return this.auditService.remove(id);
  }

  @Delete('logs')
  async clearOld(@Query('days') days: number = 90) {
    return this.auditService.clearOldLogs(days);
  }
}