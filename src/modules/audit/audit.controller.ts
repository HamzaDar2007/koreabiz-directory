import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditService } from './audit.service';
import { ListAuditLogsDto } from './dto/list-audit-logs.dto';

@Controller('audit') // Changed from 'admin/audit' to match '/v1/audit/logs'
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AuditController {
  constructor(private readonly auditService: AuditService) { }

  @Get('logs') // Added 'logs' path
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
}