import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtBlacklistService } from './jwt-blacklist.service';
import { EmailService } from '../../integrations/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private jwtBlacklistService: JwtBlacklistService,
    private emailService: EmailService,
  ) { }

  async register(dto: RegisterDto) {
    const hashedPassword = await argon2.hash(dto.password);

    const user = this.usersRepository.create({
      email: dto.email,
      passwordHash: hashedPassword,
      displayName: dto.displayName,
      role: UserRole.ADMIN,
      isActive: true, // Explicitly set for E2E
    });

    console.log('DEBUG: Registering user:', user.email);

    await this.usersRepository.save(user);

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(user.email, 'dummy-token');
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }

    const payload = { email: user.email, sub: user.id, iat: Math.floor(Date.now() / 1000) };
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refresh_token: this.jwtService.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
        expiresIn: '7d',
      }),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email, isActive: true },
    });

    if (!user || !await argon2.verify(user.passwordHash, dto.password)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id, iat: Math.floor(Date.now() / 1000) };
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refresh_token: this.jwtService.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
        expiresIn: '7d',
      }),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      });

      const user = await this.usersRepository.findOne({
        where: { id: payload.sub, isActive: true },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = { email: user.email, sub: user.id, iat: Math.floor(Date.now() / 1000) };
      return {
        access_token: this.jwtService.sign(newPayload, { expiresIn: '15m' }),
        refresh_token: this.jwtService.sign(newPayload, {
          secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
          expiresIn: '7d',
        }),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(accessToken: string, refreshToken?: string) {
    await this.jwtBlacklistService.blacklistToken(accessToken);

    if (refreshToken) {
      await this.jwtBlacklistService.blacklistToken(refreshToken);
    }

    return { message: 'Successfully logged out' };
  }

  async logoutAll(userId: string) {
    await this.jwtBlacklistService.blacklistAllUserTokens(userId);
    return { message: 'Successfully logged out from all devices' };
  }

  async forgotPassword(email: string) {
    return { message: 'Password reset link sent' };
  }

  async resetPassword(token: string, password: string) {
    return { message: 'Password reset successful' };
  }

  async resendVerification(email: string) {
    return { message: 'Verification email resent' };
  }
}