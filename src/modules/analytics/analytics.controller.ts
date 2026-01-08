import { Controller, Post, Get, Body, Query, UseGuards, Req, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EnterpriseAccessGuard } from '../../common/guards/enterprise-access.guard';
import { Public } from '../../common/decorators/public.decorator';
import { AnalyticsService } from './analytics.service';
import { RecordEventDto } from './dto/record-event.dto';
import { GetAnalyticsDto } from './dto/get-analytics.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Post('events')
  @Public()
  async recordEvent(@Body() dto: RecordEventDto, @Req() req: any) {
    const ipHash = req.ip;
    return this.analyticsService.recordEvent(dto, ipHash);
  }

  @Get('enterprise/:enterpriseId')
  @UseGuards(JwtAuthGuard, EnterpriseAccessGuard)
  async getAnalytics(
    @Param('enterpriseId') enterpriseId: string,
    @Query() dto: Omit<GetAnalyticsDto, 'enterpriseId'>,
  ) {
    return this.analyticsService.getAnalytics({ ...dto, enterpriseId });
  }

  @Get('enterprise/:enterpriseId/dashboard')
  @UseGuards(JwtAuthGuard, EnterpriseAccessGuard)
  async getDashboardStats(@Param('enterpriseId') enterpriseId: string) {
    return this.analyticsService.getDashboardStats(enterpriseId);
  }
}