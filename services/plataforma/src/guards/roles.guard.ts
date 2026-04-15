import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface JwtUser {
  sub: string;
  rol: string;
  area: string | null;
  provider: string;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ user: JwtUser }>();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.rol)) {
      throw new ForbiddenException(
        `Acceso denegado. Roles requeridos: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
