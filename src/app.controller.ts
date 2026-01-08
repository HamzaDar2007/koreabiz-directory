import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @Public()
  getHello() {
    return {
      message: 'KoreaBiz Directory API is running!',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('app/version')
  @Public()
  getAppVersion() {
    return {
      version: '1.0.0',
      updateRequired: false,
    };
  }
}