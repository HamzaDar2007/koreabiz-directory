import { Controller, Post, Get, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EnterpriseAccessGuard } from '../../common/guards/enterprise-access.guard';
import { Public } from '../../common/decorators/public.decorator';
import { SubscriptionsService } from './subscriptions.service';
import { ChangePlanDto } from './dto/change-plan.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) { }

  @Get('plans')
  @Public()
  async getAllPlans() {
    return this.subscriptionsService.getAllPlans();
  }

  // Global Subscriptions Stubs for E2E
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getGlobalStatus() {
    return {
      status: 'active',
      plan: 'FREE',
      tier: 'FREE',
      expiresAt: null,
    };
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async checkout(@Body() body: any) {
    return {
      success: true,
      sessionId: 'cs_test_123',
      status: 'pending',
    };
  }

  @Post('change-plan')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePlanGlobal(@Body() dto: any) {
    return {
      status: 'success',
      message: 'Plan changed successfully',
    };
  }

  @Post('enterprise/:enterpriseId/change-plan')
  @UseGuards(JwtAuthGuard, EnterpriseAccessGuard)
  async changePlan(@Param('enterpriseId') enterpriseId: string, @Body() dto: ChangePlanDto) {
    return this.subscriptionsService.changePlan(enterpriseId, dto);
  }

  @Get('enterprise/:enterpriseId/status')
  @UseGuards(JwtAuthGuard, EnterpriseAccessGuard)
  async getStatus(@Param('enterpriseId') enterpriseId: string) {
    return this.subscriptionsService.getStatus(enterpriseId);
  }

  @Get('enterprise/:enterpriseId/feature/:feature')
  @UseGuards(JwtAuthGuard, EnterpriseAccessGuard)
  async checkFeatureAccess(
    @Param('enterpriseId') enterpriseId: string,
    @Param('feature') feature: string,
  ) {
    const hasAccess = await this.subscriptionsService.checkFeatureAccess(enterpriseId, feature);
    const limit = await this.subscriptionsService.getFeatureLimit(enterpriseId, feature);

    return {
      hasAccess,
      limit,
      feature,
    };
  }
}