import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimitService {
  constructor(private redisService: RedisService) {}

  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Math.floor(Date.now() / 1000);
    const window = Math.floor(now / windowSeconds);
    const redisKey = `rate_limit:${key}:${window}`;

    const current = await this.redisService.incr(redisKey);
    
    if (current === 1) {
      await this.redisService.expire(redisKey, windowSeconds);
    }

    const allowed = current <= limit;
    const remaining = Math.max(0, limit - current);
    const resetTime = (window + 1) * windowSeconds;

    return {
      allowed,
      remaining,
      resetTime,
    };
  }

  async checkUserRateLimit(userId: string, action: string): Promise<boolean> {
    const limits = {
      'review_create': { limit: 5, window: 3600 }, // 5 reviews per hour
      'claim_submit': { limit: 3, window: 86400 }, // 3 claims per day
      'login_attempt': { limit: 10, window: 900 }, // 10 login attempts per 15 minutes
    };

    const config = limits[action as keyof typeof limits];
    if (!config) return true;

    const result = await this.checkRateLimit(
      `user:${userId}:${action}`,
      config.limit,
      config.window,
    );

    return result.allowed;
  }

  async checkIPRateLimit(ip: string, action: string): Promise<boolean> {
    const limits = {
      'api_request': { limit: 1000, window: 3600 }, // 1000 requests per hour
      'search': { limit: 100, window: 300 }, // 100 searches per 5 minutes
    };

    const config = limits[action as keyof typeof limits];
    if (!config) return true;

    const result = await this.checkRateLimit(
      `ip:${ip}:${action}`,
      config.limit,
      config.window,
    );

    return result.allowed;
  }
}