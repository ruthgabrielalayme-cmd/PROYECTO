import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = req.headers['x-internal-token'];
    const expected = this.config.get<string>('INTERNAL_API_SECRET');
    if (!expected) throw new UnauthorizedException('Token interno no configurado');
    if (!token || token !== expected) throw new UnauthorizedException('Acceso interno no autorizado');
    if (!expected) {
      throw new UnauthorizedException('Token interno no configurado');
    }
    if (!token || token !== expected) {
      throw new UnauthorizedException('Acceso interno no autorizado');
    }
    return true;
  }
}