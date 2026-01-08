import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtBlacklistService } from './jwt-blacklist.service';
import { User } from '../users/entities/user.entity';
import { RbacModule } from '../rbac/rbac.module';
import { RedisModule } from '../../integrations/redis/redis.module';
import { EmailModule } from '../../integrations/email/email.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    RedisModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
    }),
    RbacModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtBlacklistService],
  exports: [AuthService, JwtBlacklistService],
})
export class AuthModule { }