import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClaimsController } from './claims.controller';
import { AdminClaimsController } from './admin-claims.controller';
import { ClaimsService } from './claims.service';
import { Claim } from './entities/claim.entity';
import { Enterprise } from '../enterprises/entities/enterprise.entity';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../../integrations/email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([Claim, Enterprise]), AuditModule, EmailModule],
  controllers: [ClaimsController, AdminClaimsController],
  providers: [ClaimsService],
  exports: [ClaimsService],
})
export class ClaimsModule { }