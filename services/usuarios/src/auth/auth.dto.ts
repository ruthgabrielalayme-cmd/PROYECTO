import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { Provider } from '../usuarios/usuario.entity';

export class LoginFederadoDto {
  /** Token OIDC (id_token o access_token) obtenido por el frontend del IDP */
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsEnum(Provider)
  provider!: Provider;
}

export interface JwtPayload {
  sub: string;        // UUID interno SAFDA
  rol: string;
  area: string | null;
  provider: string;
  iat?: number;
  exp?: number;
}
