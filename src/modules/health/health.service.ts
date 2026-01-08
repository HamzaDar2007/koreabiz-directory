import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import { MeiliSearch } from 'meilisearch';

@Injectable()
export class HealthService {
  private redis: Redis;
  private meilisearch: MeiliSearch;

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379');

    this.redis = new Redis(redisPort, redisHost, {
      maxRetriesPerRequest: 0,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy: () => null, // Stop retrying on failure
    });

    this.redis.on('error', (err) => {
      // Catch and silence all redis errors
    });

    this.meilisearch = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
      apiKey: process.env.MEILISEARCH_API_KEY,
    });
  }

  async check() {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
        meilisearch: await this.checkMeilisearch(),
      },
    };

    const allHealthy = Object.values(health.services).every(service => service.status === 'ok');
    health.status = allHealthy ? 'ok' : 'degraded';

    return health;
  }

  private async checkDatabase() {
    try {
      const start = Date.now();
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ok',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  private async checkRedis() {
    try {
      const start = Date.now();
      await this.redis.ping();
      return {
        status: 'ok',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  private async checkMeilisearch() {
    try {
      const start = Date.now();
      await this.meilisearch.health();
      return {
        status: 'ok',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }
}