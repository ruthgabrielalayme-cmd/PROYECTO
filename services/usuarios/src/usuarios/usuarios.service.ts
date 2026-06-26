import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoUsuario, Rol, Usuario } from './usuario.entity';
import { UpdateUsuarioDto } from './usuario.dto';

@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepo: Repository<Usuario>,
  ) {}

  async findAll(user: { rol: string; area: string | null }, search?: string): Promise<Usuario[]> {
    const qb = this.usuariosRepo.createQueryBuilder('usuario');

    if (user.rol === Rol.ADMIN) {
      if (search) {
        qb.andWhere('usuario.nombre_completo LIKE :search', { search: `%${search}%` });
      }
    } else {
      // FUNCIONARIO o ENCARGADO
      if (search) {
        // Búsqueda global, pero solo activos
        qb.andWhere('usuario.nombre_completo LIKE :search', { search: `%${search}%` })
          .andWhere('usuario.estado = :estado', { estado: EstadoUsuario.ACTIVO });
      } else {
        // Sin búsqueda: solo los de su área
        if (user.area) {
          qb.andWhere('usuario.area = :area', { area: user.area });
        } else {
          // Si el usuario no tiene área asignada y no es admin, no ve a nadie para prevenir fugas
          qb.andWhere('1 = 0');
        }
      }
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Usuario> {
    const usuario = await this.usuariosRepo.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }
    return usuario;
  }

  async update(id: string, dto: UpdateUsuarioDto): Promise<Usuario> {
    const usuario = await this.findOne(id);
    Object.assign(usuario, dto);
    const saved = await this.usuariosRepo.save(usuario);
    this.logger.log(`Usuario actualizado: ${id}`);
    return saved;
  }

  async findByProviderSub(
    provider: string,
    providerSub: string,
  ): Promise<Usuario | null> {
    return this.usuariosRepo.findOne({
      where: { provider: provider as Usuario['provider'], provider_sub: providerSub },
    });
  }

  // ── NUEVO ──────────────────────────────────────────────────────────────────
  async findByCorreo(correo: string): Promise<Usuario | null> {
    return this.usuariosRepo.findOne({ where: { correo } });
  }
  // ──────────────────────────────────────────────────────────────────────────

  async save(usuario: Partial<Usuario>): Promise<Usuario> {
    return this.usuariosRepo.save(usuario);
  }
}
