import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { EnterpriseAnalyticsDaily } from './entities/enterprise-analytics-daily.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EnterpriseAnalyticsDaily])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}