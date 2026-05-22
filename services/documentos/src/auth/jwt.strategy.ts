import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

    @Injectable()
    export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private config: ConfigService) {
        super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: config.get<string>('JWT_INTERNAL_SECRET')!,
        });
    }

    async validate(payload: any) {
        // payload debe tener: sub, rol, area, provider
        return { id: payload.sub, rol: payload.rol, area: payload.area, provider: payload.provider };
    }
    }