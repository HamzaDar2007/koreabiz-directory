import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);
  private isConnected = false;
  private memoryStorage = new Map<string, string>(); // Fallback for tests

  async onModuleInit() {
    // Skip Redis initialization if not available
    if (!process.env.REDIS_HOST && process.env.NODE_ENV !== 'production') {
      this.logger.warn('Redis host not configured - running with in-memory fallback for tests');
      this.isConnected = false;
      return;
    }

    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 0,
        enableReadyCheck: false,
        lazyConnect: true,
        retryStrategy: (times) => {
          if (process.env.NODE_ENV !== 'production' && times > 3) {
            return null;
          }
          return Math.min(times * 100, 3000);
        }
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Redis connected successfully');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
      });

      await this.client.connect().catch(() => { });
    } catch (error) {
      this.logger.warn('Redis unavailable - running with in-memory fallback for tests');
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      await this.client.quit();
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected) {
      return this.memoryStorage.get(key) || null;
    }
    try {
      return await this.client.get(key);
    } catch (error) {
      return this.memoryStorage.get(key) || null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      // Basic TTL support for memory storage in tests
      setTimeout(() => this.memoryStorage.delete(key), ttl * 1000);
    }
    this.memoryStorage.set(key, value);

    if (!this.isConnected) return;
    try {
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) { }
  }

  async del(key: string): Promise<void> {
    this.memoryStorage.delete(key);
    if (!this.isConnected) return;
    try {
      await this.client.del(key);
    } catch (error) { }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return this.memoryStorage.has(key);
    }
    try {
      const result = await this.client.exists(key);
      return result === 1 || this.memoryStorage.has(key);
    } catch (error) {
      return this.memoryStorage.has(key);
    }
  }

  async incr(key: string): Promise<number> {
    const val = parseInt(this.memoryStorage.get(key) || '0') + 1;
    this.memoryStorage.set(key, val.toString());

    if (!this.isConnected) return val;
    try {
      return await this.client.incr(key);
    } catch (error) {
      return val;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    setTimeout(() => this.memoryStorage.delete(key), seconds * 1000);
    if (!this.isConnected) return;
    try {
      await this.client.expire(key, seconds);
    } catch (error) { }
  }

  getClient(): Redis | null {
    return this.isConnected ? this.client : null;
  }

  isRedisConnected(): boolean {
    return this.isConnected;
  }
}