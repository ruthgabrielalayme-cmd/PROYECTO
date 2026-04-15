import {
  Injectable,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../usuarios/usuarios.service';
import {
  Usuario,
  Provider,
  EstadoUsuario,
  Rol,
} from '../usuarios/usuario.entity';
import { LoginFederadoDto, JwtPayload } from './auth.dto';

/** Claims mínimos que se extraen del userinfo de Ciudadanía Digital */
interface CiudadaniaDigitalClaims {
  sub: string;
  nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  documento_identidad?: string;
  email?: string;
  celular?: string;
}

/** Claims del id_token / userinfo de Google */
interface GoogleClaims {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ─── Punto de entrada ──────────────────────────────────────────────────────

  async loginFederado(dto: LoginFederadoDto): Promise<{
    access_token: string;
    perfil: Partial<Usuario>;
  }> {
    let claims: CiudadaniaDigitalClaims | GoogleClaims;

    if (dto.provider === Provider.CIUDADANIA_DIGITAL) {
      claims = await this.validarTokenCD(dto.token);
    } else if (dto.provider === Provider.GOOGLE) {
      claims = await this.validarTokenGoogle(dto.token);
    } else {
      throw new UnauthorizedException('Proveedor no soportado');
    }

    const usuario = await this.upsertUsuario(dto.provider, claims);
    const access_token = this.emitirJwtInterno(usuario);

    this.logger.log(
      `Login exitoso: ${usuario.id} via ${dto.provider}`,
    );

    return {
      access_token,
      perfil: {
        id: usuario.id,
        nombre_completo: usuario.nombre_completo,
        correo: usuario.correo,
        area: usuario.area,
        rol: usuario.rol,
        estado: usuario.estado,
      },
    };
  }

  // ─── Validación Ciudadanía Digital ─────────────────────────────────────────

  private async validarTokenCD(token: string): Promise<CiudadaniaDigitalClaims> {
    const issuer = this.config.get<string>('CD_ISSUER');
    const clientId = this.config.get<string>('CD_CLIENT_ID');

    if (!issuer || !clientId) {
      throw new InternalServerErrorException('Configuración CD incompleta');
    }

    try {
      // Obtener OIDC discovery para el userinfo_endpoint
      const discoveryUrl = `${issuer}/.well-known/openid-configuration`;
      const discoveryRes = await fetch(discoveryUrl);
      if (!discoveryRes.ok) {
        throw new Error(`Discovery falló: ${discoveryRes.status}`);
      }
      const discovery = await discoveryRes.json() as { userinfo_endpoint: string };

      // Llamar al userinfo endpoint con el access_token del frontend
      const userInfoRes = await fetch(discovery.userinfo_endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userInfoRes.ok) {
        throw new UnauthorizedException('Token CD inválido o expirado');
      }

      const claims = await userInfoRes.json() as CiudadaniaDigitalClaims;

      if (!claims.sub) {
        throw new UnauthorizedException('Token CD no contiene sub');
      }

      return claims;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      this.logger.error('Error validando token CD', err);
      throw new UnauthorizedException('No se pudo validar el token de Ciudadanía Digital');
    }
  }

  // ─── Validación Google ─────────────────────────────────────────────────────

  private async validarTokenGoogle(token: string): Promise<GoogleClaims> {
    try {
      // Google expone un endpoint de tokeninfo / userinfo
      const res = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!res.ok) {
        throw new UnauthorizedException('Token Google inválido o expirado');
      }

      const claims = await res.json() as GoogleClaims;

      if (!claims.sub) {
        throw new UnauthorizedException('Token Google no contiene sub');
      }

      return claims;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      this.logger.error('Error validando token Google', err);
      throw new UnauthorizedException('No se pudo validar el token de Google');
    }
  }

  // ─── Upsert de usuario ─────────────────────────────────────────────────────

  private async upsertUsuario(
    provider: Provider,
    claims: CiudadaniaDigitalClaims | GoogleClaims,
  ): Promise<Usuario> {
    const sub = claims.sub;
    let usuario = await this.usuariosService.findByProviderSub(provider, sub);

    if (!usuario) {
      // Nuevo usuario → estado PENDIENTE_ASIGNACION
      const nuevo: Partial<Usuario> = {
        provider,
        provider_sub: sub,
        estado: EstadoUsuario.PENDIENTE_ASIGNACION,
        rol: Rol.FUNCIONARIO,
      };

      this.poblarCamposDesdeProvider(nuevo, provider, claims);
      usuario = await this.usuariosService.save(nuevo);
      this.logger.log(`Usuario creado: ${usuario.id} (${provider})`);
    } else {
      // Usuario existente → actualizar solo metadata
      this.poblarCamposDesdeProvider(usuario, provider, claims);
      usuario = await this.usuariosService.save(usuario);
      this.logger.log(`Usuario actualizado: ${usuario.id} (${provider})`);
    }

    return usuario;
  }

  private poblarCamposDesdeProvider(
    target: Partial<Usuario>,
    provider: Provider,
    claims: CiudadaniaDigitalClaims | GoogleClaims,
  ): void {
    if (provider === Provider.CIUDADANIA_DIGITAL) {
      const c = claims as CiudadaniaDigitalClaims;
      const partes = [c.nombre, c.primer_apellido, c.segundo_apellido]
        .filter(Boolean)
        .join(' ');
      target.nombre_completo = partes || null;
      target.correo = c.email ?? null;
      target.documento_identidad = c.documento_identidad ?? null;
      target.celular = c.celular ?? null;
    } else {
      const g = claims as GoogleClaims;
      target.nombre_completo = g.name ?? null;
      target.correo = g.email ?? null;
      target.foto_url = g.picture ?? null;
    }
  }

  // ─── JWT interno SAFDA ─────────────────────────────────────────────────────

  private emitirJwtInterno(usuario: Usuario): string {
    const payload: JwtPayload = {
      sub: usuario.id,
      rol: usuario.rol,
      area: usuario.area,
      provider: usuario.provider,
    };
    return this.jwtService.sign(payload);
  }
}
