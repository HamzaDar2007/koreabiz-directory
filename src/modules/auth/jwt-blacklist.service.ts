import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../integrations/redis/redis.service';

@Injectable()
export class JwtBlacklistService {
  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  async blacklistToken(token: string): Promise<void> {
    try {
      const decoded = this.jwtService.decode(token) as any;
      if (!decoded || !decoded.exp) return;

      const now = Math.floor(Date.now() / 1000);
      const ttl = decoded.exp - now;

      if (ttl > 0) {
        await this.redisService.set(`blacklist:${token}`, '1', ttl);
      }
    } catch (error) {
      // Token invalid, no need to blacklist
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.redisService.get(`blacklist:${token}`);
    return result === '1';
  }

  async blacklistAllUserTokens(userId: string): Promise<void> {
    await this.redisService.set(`user_logout:${userId}`, Date.now().toString(), 86400);
  }

  async isUserLoggedOut(userId: string, tokenIssuedAt: number): Promise<boolean> {
    const logoutTime = await this.redisService.get(`user_logout:${userId}`);
    if (!logoutTime) return false;
    
    return parseInt(logoutTime) > tokenIssuedAt * 1000;
  }
}