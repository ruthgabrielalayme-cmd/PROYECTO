import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { Provider, EstadoUsuario, Rol } from '../usuarios/usuario.entity';
import { LoginFederadoDto } from './auth.dto';

// Mock global fetch - sin importar jest, se usa la variable global de Jest
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

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
                DOMINIOS_PERMITIDOS: 'example.com, test.org',
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

  it('debería lanzar UnauthorizedException cuando el token de CD es inválido', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userinfo_endpoint: 'https://ciudadania.test/userinfo',
        }),
      })
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

  it('debería lanzar UnauthorizedException cuando el dominio de Google no está en DOMINIOS_PERMITIDOS', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        iss: 'accounts.google.com',
        sub: 'google_sub_invalido',
        email: 'user@unauthorized-domain.com',
        name: 'Usuario Dominio Invalido',
      }),
    });

    const dto: LoginFederadoDto = {
      token: 'valid_google_token_but_wrong_domain',
      provider: Provider.GOOGLE,
    };

    await expect(authService.loginFederado(dto)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(usuariosService.save).not.toHaveBeenCalled();
  });

  it('debería denegar el login tras crear un usuario nuevo con estado PENDIENTE_ASIGNACION', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        iss: 'accounts.google.com',
        sub: 'google_sub_nuevo_123',
        email: 'nuevo@example.com',
        name: 'Nuevo Usuario',
        picture: 'https://photo.url',
      }),
    });

    usuariosService.findByProviderSub.mockResolvedValueOnce(null);
    usuariosService.findByCorreo.mockResolvedValueOnce(null);

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
    usuariosService.save.mockResolvedValueOnce(mockUsuario as any);

    const dto: LoginFederadoDto = {
      token: 'valid_google_token',
      provider: Provider.GOOGLE,
    };

    await expect(authService.loginFederado(dto)).rejects.toThrow(UnauthorizedException);

    expect(usuariosService.findByProviderSub).toHaveBeenCalledWith(
      Provider.GOOGLE,
      'google_sub_nuevo_123',
    );
    expect(usuariosService.findByCorreo).toHaveBeenCalledWith('nuevo@example.com');
    expect(usuariosService.save).toHaveBeenCalledWith(
      expect.objectContaining({
        estado: EstadoUsuario.PENDIENTE_ASIGNACION,
        rol: Rol.FUNCIONARIO,
        provider: Provider.GOOGLE,
        provider_sub: 'google_sub_nuevo_123',
      }),
    );
  });

  it('debería actualizar metadata de usuario existente sin cambiar area ni rol', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        iss: 'accounts.google.com',
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
    usuariosService.findByProviderSub.mockResolvedValueOnce(mockExistente as any);
    usuariosService.save.mockResolvedValueOnce({
      ...mockExistente,
      correo: 'existente_nuevo_email@example.com',
    } as any);

    const dto: LoginFederadoDto = {
      token: 'valid_google_token_2',
      provider: Provider.GOOGLE,
    };

    await authService.loginFederado(dto);

    expect(usuariosService.save).toHaveBeenCalledWith(
      expect.objectContaining({
        area: 'DAF',
        rol: Rol.ENCARGADO,
        estado: EstadoUsuario.ACTIVO,
      }),
    );
    expect(usuariosService.findByCorreo).not.toHaveBeenCalled();
    expect(jwtService.sign).toHaveBeenCalled();
  });

  it('debería vincular provider_sub a usuario pre-registrado encontrado por correo', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        iss: 'accounts.google.com',
        sub: 'google_sub_real_789',
        email: 'ruthgabrielalayme@example.com',
        name: 'Ruth Gabriela Layme',
        picture: 'https://photo.url',
      }),
    });

    usuariosService.findByProviderSub.mockResolvedValueOnce(null);

    const mockPreRegistrado = {
      id: 'uuid-preregistrado',
      provider: Provider.GOOGLE,
      provider_sub: null,
      estado: EstadoUsuario.ACTIVO,
      rol: Rol.ADMIN,
      area: null,
      correo: 'ruthgabrielalayme@example.com',
      nombre_completo: 'Ruth Gabriela Layme',
      foto_url: null,
      documento_identidad: null,
      celular: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    usuariosService.findByCorreo.mockResolvedValueOnce(mockPreRegistrado as any);

    const mockVinculado = {
      ...mockPreRegistrado,
      provider_sub: 'google_sub_real_789',
    };
    usuariosService.save.mockResolvedValue(mockVinculado as any);

    const dto: LoginFederadoDto = {
      token: 'valid_google_token_3',
      provider: Provider.GOOGLE,
    };

    const result = await authService.loginFederado(dto);

    expect(usuariosService.findByCorreo).toHaveBeenCalledWith(
      'ruthgabrielalayme@example.com',
    );
    expect(usuariosService.save).toHaveBeenCalledWith(
      expect.objectContaining({
        provider_sub: 'google_sub_real_789',
      }),
    );
    expect(result.perfil.rol).toBe(Rol.ADMIN);
    expect(result.perfil.estado).toBe(EstadoUsuario.ACTIVO);
    expect(result.access_token).toBe('mocked.jwt.token');
  });

  // NUEVO TEST: verificar que un usuario con estado PENDIENTE_ASIGNACION no pueda loguearse
  it('debería denegar login si el usuario tiene estado PENDIENTE_ASIGNACION', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        iss: 'accounts.google.com',
        sub: 'google_sub_pendiente',
        email: 'pendiente@example.com',
        name: 'Usuario Pendiente',
      }),
    });

    const usuarioPendiente = {
      id: 'uuid-pendiente',
      provider: Provider.GOOGLE,
      provider_sub: 'google_sub_pendiente',
      estado: EstadoUsuario.PENDIENTE_ASIGNACION,
      rol: Rol.FUNCIONARIO,
      correo: 'pendiente@example.com',
      nombre_completo: 'Usuario Pendiente',
      foto_url: null,
      area: null,
      documento_identidad: null,
      celular: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    usuariosService.findByProviderSub.mockResolvedValueOnce(usuarioPendiente as any);
    // Debe llamarse a save para actualizar la metadata antes de denegar
    usuariosService.save.mockResolvedValueOnce(usuarioPendiente as any);

    const dto: LoginFederadoDto = {
      token: 'valid_token',
      provider: Provider.GOOGLE,
    };

    await expect(authService.loginFederado(dto)).rejects.toThrow(UnauthorizedException);
    expect(jwtService.sign).not.toHaveBeenCalled();
  });
});