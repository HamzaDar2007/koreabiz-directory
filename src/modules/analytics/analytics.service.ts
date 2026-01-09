import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnterpriseAnalyticsDaily } from './entities/enterprise-analytics-daily.entity';
import { RecordEventDto } from './dto/record-event.dto';
import { GetAnalyticsDto } from './dto/get-analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(EnterpriseAnalyticsDaily)
    private analyticsRepository: Repository<EnterpriseAnalyticsDaily>,
  ) { }

  async recordEvent(dto: RecordEventDto, ipHash: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.analyticsRepository.findOne({
      where: {
        enterpriseId: dto.enterpriseId,
        day: today,
      },
    });

    if (existing) {
      // Update existing record
      if (dto.eventType === 'page_view') existing.pageViews += 1;
      if (dto.eventType === 'search_impression') existing.searchImpressions += 1;
      if (dto.eventType === 'cta_click') existing.ctaClicks += 1;

      await this.analyticsRepository.save(existing);
    } else {
      // Create new record
      const analytics = this.analyticsRepository.create({
        enterpriseId: dto.enterpriseId,
        day: today,
        pageViews: dto.eventType === 'page_view' ? 1 : 0,
        searchImpressions: dto.eventType === 'search_impression' ? 1 : 0,
        ctaClicks: dto.eventType === 'cta_click' ? 1 : 0,
      });

      await this.analyticsRepository.save(analytics);
    }
  }

  async getAnalytics(dto: GetAnalyticsDto) {
    const query = this.analyticsRepository
      .createQueryBuilder('analytics')
      .where('analytics.enterpriseId = :enterpriseId', { enterpriseId: dto.enterpriseId });

    if (dto.startDate) {
      query.andWhere('analytics.day >= :startDate', { startDate: dto.startDate });
    }
    if (dto.endDate) {
      query.andWhere('analytics.day <= :endDate', { endDate: dto.endDate });
    }

    const data = await query.orderBy('analytics.day', 'DESC').getMany();

    // Calculate totals
    const totals = data.reduce(
      (acc, curr) => ({
        pageViews: acc.pageViews + curr.pageViews,
        searchImpressions: acc.searchImpressions + curr.searchImpressions,
        ctaClicks: acc.ctaClicks + curr.ctaClicks,
      }),
      { pageViews: 0, searchImpressions: 0, ctaClicks: 0 },
    );

    return {
      data,
      totals,
      period: {
        startDate: dto.startDate,
        endDate: dto.endDate,
      },
    };
  }

  async getDashboardStats(enterpriseId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const stats = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select('SUM(analytics.pageViews)', 'totalPageViews')
      .addSelect('SUM(analytics.searchImpressions)', 'totalSearchImpressions')
      .addSelect('SUM(analytics.ctaClicks)', 'totalCtaClicks')
      .addSelect('AVG(analytics.pageViews)', 'avgDailyPageViews')
      .where('analytics.enterpriseId = :enterpriseId', { enterpriseId })
      .andWhere('analytics.day >= :startDate', { startDate: thirtyDaysAgo })
      .getRawOne();

    return {
      totalPageViews: parseInt(stats.totalPageViews) || 0,
      totalSearchImpressions: parseInt(stats.totalSearchImpressions) || 0,
      totalCtaClicks: parseInt(stats.totalCtaClicks) || 0,
      avgDailyPageViews: parseFloat(stats.avgDailyPageViews) || 0,
      period: '30 days',
    };
  }

  async clearAnalytics(enterpriseId: string) {
    await this.analyticsRepository.delete({ enterpriseId });
    return { success: true };
  }
}