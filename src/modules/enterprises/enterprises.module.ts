import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnterprisesController } from './enterprises.controller';
import { AdminEnterprisesController } from './admin-enterprises.controller';
import { EnterprisesService } from './enterprises.service';
import { Enterprise } from './entities/enterprise.entity';
import { EnterpriseHours } from './entities/enterprise-hours.entity';
import { EnterpriseClosedDay } from './entities/enterprise-closed-day.entity';
import { EnterpriseMedia } from './entities/enterprise-media.entity';
import { EnterpriseStaff } from './entities/enterprise-staff.entity';
import { AuditModule } from '../audit/audit.module';
import { RbacModule } from '../rbac/rbac.module';
import { MeilisearchModule } from '../../integrations/meilisearch/meilisearch.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Enterprise,
      EnterpriseHours,
      EnterpriseClosedDay,
      EnterpriseMedia,
      EnterpriseStaff,
    ]),
    AuditModule,
    RbacModule,
    MeilisearchModule,
  ],
  controllers: [EnterprisesController, AdminEnterprisesController],
  providers: [EnterprisesService],
  exports: [EnterprisesService],
})
export class EnterprisesModule {}