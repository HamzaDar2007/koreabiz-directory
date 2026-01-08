import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { JwtBlacklistService } from '../../modules/auth/jwt-blacklist.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private jwtBlacklistService: JwtBlacklistService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (token) {
      const isBlacklisted = await this.jwtBlacklistService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        console.log('DEBUG: JwtAuthGuard token is blacklisted');
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    try {
      const result = await super.canActivate(context) as boolean;
      console.log('DEBUG: JwtAuthGuard super.canActivate result:', result);

      // Additional check for user-level logout
      if (result && request.user) {
        const tokenIssuedAt = request.user.iat;
        const isUserLoggedOut = await this.jwtBlacklistService.isUserLoggedOut(
          request.user.sub,
          tokenIssuedAt
        );

        if (isUserLoggedOut) {
          console.log('DEBUG: JwtAuthGuard user is logged out (all devices)');
          throw new UnauthorizedException('User has been logged out');
        }
      }

      return result;
    } catch (error) {
      console.log('DEBUG: JwtAuthGuard error:', error.message);
      throw error;
    }
  }
}