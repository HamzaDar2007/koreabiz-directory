import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { ListAuditLogsDto } from './dto/list-audit-logs.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) { }

  async log(
    actorUserId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, any>,
  ) {
    const auditLog = this.auditRepository.create({
      actorUserId,
      action,
      entityType,
      entityId,
      metadata,
    });
    return this.auditRepository.save(auditLog);
  }

  async list(dto: ListAuditLogsDto) {
    const query = this.auditRepository.createQueryBuilder('audit');

    if (dto.actorUserId) {
      query.andWhere('audit.actorUserId = :actorUserId', { actorUserId: dto.actorUserId });
    }
    if (dto.action) {
      query.andWhere('audit.action = :action', { action: dto.action });
    }
    if (dto.entityType) {
      query.andWhere('audit.entityType = :entityType', { entityType: dto.entityType });
    }
    if (dto.entityId) {
      query.andWhere('audit.entityId = :entityId', { entityId: dto.entityId });
    }
    if (dto.startDate) {
      query.andWhere('audit.createdAt >= :startDate', { startDate: dto.startDate });
    }
    if (dto.endDate) {
      query.andWhere('audit.createdAt <= :endDate', { endDate: dto.endDate });
    }

    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const offset = (page - 1) * limit;
    return query
      .orderBy('audit.createdAt', 'DESC')
      .skip(offset)
      .take(dto.limit)
      .getManyAndCount();
  }
}