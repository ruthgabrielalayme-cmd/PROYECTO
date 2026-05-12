import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoDocumento } from './tipo-documento.entity';

@Injectable()
export class TiposDocumentoService {
  constructor(
    @InjectRepository(TipoDocumento)
    private readonly repo: Repository<TipoDocumento>,
  ) {}

  async findAll(): Promise<TipoDocumento[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<TipoDocumento> {
    const tipo = await this.repo.findOne({ where: { id } });
    if (!tipo) throw new NotFoundException(`TipoDocumento ${id} no encontrado`);
    return tipo;
  }

  async create(data: { nombre: string; plantilla_path?: string }): Promise<TipoDocumento> {
    const nuevo = this.repo.create(data);
    return this.repo.save(nuevo);
  }

  async actualizarPlantilla(id: string, rutaRelativa: string): Promise<TipoDocumento> {
    const tipo = await this.findOne(id);
    tipo.plantilla_path = rutaRelativa;
    return this.repo.save(tipo);
  }
}
