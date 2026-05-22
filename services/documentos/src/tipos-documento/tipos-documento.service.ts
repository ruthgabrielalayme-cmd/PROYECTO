import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoDocumento } from './tipo-documento.entity';
import { CreateTipoDocumentoDto } from './tipo-documento.dto';

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
    if (!tipo) throw new NotFoundException(`Tipo de documento ${id} no encontrado`);
    return tipo;
  }

  // CREAR solo con nombre (plantilla_path = null)
  async create(dto: CreateTipoDocumentoDto): Promise<TipoDocumento> {
    const nuevo = this.repo.create({
      nombre: dto.nombre,
      plantilla_path: null,
    });
    return this.repo.save(nuevo);
  }

  // NUEVO MÉTODO: actualizar la ruta de la plantilla
  async actualizarPlantilla(id: string, plantillaPath: string): Promise<TipoDocumento> {
    const tipo = await this.findOne(id);
    tipo.plantilla_path = plantillaPath;
    return this.repo.save(tipo);
  }
}