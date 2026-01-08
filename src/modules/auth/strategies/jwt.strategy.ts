import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET') || 'your-secret-key';
    console.log('DEBUG: JwtStrategy constructor using secret (prefix):', secret.substring(0, 5) + '...');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    console.log('DEBUG: JwtStrategy validating payload:', JSON.stringify(payload));
    const user = await this.usersRepository.findOne({
      where: { id: payload.sub, isActive: true },
    });

    if (!user) {
      console.log('DEBUG: JwtStrategy user not found or inactive for sub:', payload.sub);
      throw new UnauthorizedException();
    }
    console.log('DEBUG: JwtStrategy user found:', user.email);

    return {
      sub: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      iat: payload.iat,
    };
  }
}