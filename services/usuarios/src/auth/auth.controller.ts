import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginFederadoDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   * El frontend envía el token OIDC obtenido del IDP externo (CD o Google)
   * junto con el campo "provider". El backend valida, hace upsert del usuario
   * y retorna un JWT interno SAFDA.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginFederadoDto) {
    return this.authService.loginFederado(dto);
  }
}
