import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  async check() {
    return this.healthService.check();
  }

  @Get('ready')
  @Public()
  async ready() {
    const health = await this.healthService.check();
    return { status: health.status === 'ok' ? 'ready' : 'not ready' };
  }

  @Get('live')
  @Public()
  async live() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }
}