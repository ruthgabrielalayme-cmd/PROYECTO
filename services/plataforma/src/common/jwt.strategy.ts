import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  rol: string;
  area: string | null;
  provider: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_INTERNAL_SECRET');
    if (!secret) throw new Error('JWT_INTERNAL_SECRET no configurado');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload): any {
    if (!payload.sub) throw new UnauthorizedException('Token inválido');
    // Mapear sub a id para que req.user.id esté disponible
    return {
      id: payload.sub,
      rol: payload.rol,
      area: payload.area,
      provider: payload.provider
    };
  }
}
