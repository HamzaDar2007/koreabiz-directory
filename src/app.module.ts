import { Module, NestModule, MiddlewareConsumer, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard, ThrottlerModuleOptions } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { RedisModule } from './integrations/redis/redis.module';
import { EmailModule } from './integrations/email/email.module';
import { RateLimitModule } from './integrations/rate-limit/rate-limit.module';
import { AuthModule } from './modules/auth/auth.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { UsersModule } from './modules/users/users.module';
import { EnterprisesModule } from './modules/enterprises/enterprises.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CitiesModule } from './modules/cities/cities.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ClaimsModule } from './modules/claims/claims.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { MediaModule } from './modules/media/media.module';
import { AuditModule } from './modules/audit/audit.module';
import { SearchModule } from './modules/search/search.module';
import { HealthModule } from './modules/health/health.module';
import { GlobalExceptionFilter } from './common/global-exception.filter';
import { QueryFailedErrorFilter } from './common/filters/query-failed.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'koreabiz_directory',
      autoLoadEntities: true,
      synchronize: false,
      migrations: ['dist/database/migrations/*{.ts,.js}'],
      migrationsRun: false,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): ThrottlerModuleOptions => {
        const isTest = process.env.NODE_ENV === 'test' || config.get('NODE_ENV') === 'test';
        if (isTest) {
          return [
            {
              name: 'short',
              ttl: 1000,
              limit: 30, // Higher to allow concurrent tests to pass
            },
            {
              name: 'medium',
              ttl: 10000,
              limit: 500,
            },
            {
              name: 'long',
              ttl: 60000,
              limit: 1000,
            },
          ];
        }
        return [
          {
            name: 'short',
            ttl: 1000,
            limit: 3,
          },
          {
            name: 'medium',
            ttl: 10000,
            limit: 20,
          },
          {
            name: 'long',
            ttl: 60000,
            limit: 100,
          },
        ];
      },
    }),
    ScheduleModule.forRoot(),
    RedisModule,
    EmailModule,
    RateLimitModule,
    AuthModule,
    RbacModule,
    UsersModule,
    EnterprisesModule,
    CategoriesModule,
    CitiesModule,
    ReviewsModule,
    ClaimsModule,
    SubscriptionsModule,
    AnalyticsModule,
    FavoritesModule,
    MediaModule,
    AuditModule,
    SearchModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: QueryFailedErrorFilter,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}