import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './usuario.entity';
import { UpdateUsuarioDto } from './usuario.dto';

@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepo: Repository<Usuario>,
  ) {}

  async findAll(): Promise<Usuario[]> {
    return this.usuariosRepo.find();
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

  async save(usuario: Partial<Usuario>): Promise<Usuario> {
    return this.usuariosRepo.save(usuario);
  }
}
