import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { Provider, EstadoUsuario, Rol } from '../usuarios/usuario.entity';
import { LoginFederadoDto } from './auth.dto';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AuthService', () => {
  let authService: AuthService;
  let usuariosService: jest.Mocked<UsuariosService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsuariosService,
          useValue: {
            findByProviderSub: jest.fn(),
            findByCorreo: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mocked.jwt.token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const map: Record<string, string> = {
                CD_ISSUER: 'https://ciudadania.test',
                CD_CLIENT_ID: 'client_test',
                JWT_INTERNAL_SECRET: 'test_secret',
                JWT_INTERNAL_EXPIRES_IN: '8h',
              };
              return map[key];
            }),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usuariosService = module.get(UsuariosService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── Test 1: Token CD inválido lanza UnauthorizedException ──────────────

  it('debería lanzar UnauthorizedException cuando el token de CD es inválido', async () => {
    // Simula discovery OK
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userinfo_endpoint: 'https://ciudadania.test/userinfo',
        }),
      })
      // Simula userinfo con error 401
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

    const dto: LoginFederadoDto = {
      token: 'invalid_token',
      provider: Provider.CIUDADANIA_DIGITAL,
    };

    await expect(authService.loginFederado(dto)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  // ─── Test 2: Token Google inválido lanza UnauthorizedException ──────────

  it('debería lanzar UnauthorizedException cuando el token de Google es inválido', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const dto: LoginFederadoDto = {
      token: 'invalid_google_token',
      provider: Provider.GOOGLE,
    };

    await expect(authService.loginFederado(dto)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  // ─── Test 3: Usuario nuevo se crea con PENDIENTE_ASIGNACION ─────────────

  it('debería crear un usuario nuevo con estado PENDIENTE_ASIGNACION si sub+provider no existen', async () => {
    // Mock Google userinfo retorna claims válidos
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sub: 'google_sub_nuevo_123',
        email: 'nuevo@example.com',
        name: 'Nuevo Usuario',
        picture: 'https://photo.url',
      }),
    });

    // No existe usuario previo por sub ni correo
    usuariosService.findByProviderSub.mockResolvedValueOnce(null);
    usuariosService.findByCorreo.mockResolvedValueOnce(null);

    // Mock save retorna el usuario creado
    const mockUsuario = {
      id: 'uuid-generado',
      provider: Provider.GOOGLE,
      provider_sub: 'google_sub_nuevo_123',
      estado: EstadoUsuario.PENDIENTE_ASIGNACION,
      rol: Rol.FUNCIONARIO,
      correo: 'nuevo@example.com',
      nombre_completo: 'Nuevo Usuario',
      foto_url: 'https://photo.url',
      area: null,
      documento_identidad: null,
      celular: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    usuariosService.save.mockResolvedValueOnce(mockUsuario as any);

    const dto: LoginFederadoDto = {
      token: 'valid_google_token',
      provider: Provider.GOOGLE,
    };

    const result = await authService.loginFederado(dto);

    expect(usuariosService.findByProviderSub).toHaveBeenCalledWith(
      Provider.GOOGLE,
      'google_sub_nuevo_123',
    );
    expect(usuariosService.save).toHaveBeenCalledWith(
      expect.objectContaining({
        estado: EstadoUsuario.PENDIENTE_ASIGNACION,
        rol: Rol.FUNCIONARIO,
        provider: Provider.GOOGLE,
        provider_sub: 'google_sub_nuevo_123',
      }),
    );
    expect(result.access_token).toBe('mocked.jwt.token');
    expect(result.perfil.estado).toBe(EstadoUsuario.PENDIENTE_ASIGNACION);
  });

  // ─── Test 4: Usuario existente actualiza metadata sin cambiar area/rol ───

  it('debería actualizar metadata de usuario existente sin cambiar area ni rol', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sub: 'google_sub_existente_456',
        email: 'existente_nuevo_email@example.com',
        name: 'Nombre Actualizado',
        picture: 'https://new-photo.url',
      }),
    });

    const mockExistente = {
      id: 'uuid-existente',
      provider: Provider.GOOGLE,
      provider_sub: 'google_sub_existente_456',
      estado: EstadoUsuario.ACTIVO,
      rol: Rol.ENCARGADO,
      area: 'DAF',
      correo: 'viejo@example.com',
      nombre_completo: 'Nombre Viejo',
      foto_url: null,
      documento_identidad: null,
      celular: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    usuariosService.findByProviderSub.mockResolvedValueOnce(mockExistente as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    usuariosService.save.mockResolvedValueOnce({ ...mockExistente, correo: 'existente_nuevo_email@example.com' } as any);

    const dto: LoginFederadoDto = {
      token: 'valid_google_token_2',
      provider: Provider.GOOGLE,
    };

    await authService.loginFederado(dto);

    // Verifica que save recibe el usuario con area y rol intactos
    expect(usuariosService.save).toHaveBeenCalledWith(
      expect.objectContaining({
        area: 'DAF',
        rol: Rol.ENCARGADO,
        estado: EstadoUsuario.ACTIVO,
      }),
    );
    expect(jwtService.sign).toHaveBeenCalled();
  });
});
