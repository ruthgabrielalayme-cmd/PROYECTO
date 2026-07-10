import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = req.headers['x-internal-token'];
    const expected = this.config.get<string>('INTERNAL_API_SECRET') || 'reemplaza_con_un_secret_largo_y_seguro';
    const logger = new Logger('InternalGuard');
    if (!expected) {
      throw new UnauthorizedException('Token interno no configurado');
    }
    if (!token || token !== expected) {
      logger.warn(`Token mismatch. Received: ${token}, Expected: ${expected}`);
      throw new UnauthorizedException('Acceso interno no autorizado');
    }
    return true;
  }
}