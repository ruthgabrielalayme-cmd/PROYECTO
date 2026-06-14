import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { HojaRuta, EstadoHojaRuta } from './hoja-ruta.entity';
import { CreateHojaRutaDto } from './hoja-ruta.dto';

@Injectable()
export class HojasRutaService {
  private readonly logger = new Logger(HojasRutaService.name);

  constructor(
    @InjectRepository(HojaRuta)
    private readonly repo: Repository<HojaRuta>,
  ) {}

  async findAll(user: any): Promise<HojaRuta[]> {
    if (user.rol === 'ADMIN') {
      return this.repo.find({ relations: ['derivaciones'] });
    } else if (user.rol === 'ENCARGADO') {
      return this.repo.find({
        where: { area_origen: user.area },
        relations: ['derivaciones'],
      });
    } else {
      // FUNCIONARIO
      return this.repo.find({
        where: { creado_por: user.sub },
        relations: ['derivaciones'],
      });
    }
  }

  async create(dto: CreateHojaRutaDto): Promise<HojaRuta> {
    const anio = new Date().getFullYear();
    const codigo = await this.generarCodigo(dto.area_origen, anio);

    const hr = this.repo.create({
      codigo,
      area_origen: dto.area_origen,
      creado_por: dto.creado_por,
    });

    const saved = await this.repo.save(hr);
    this.logger.log(`HojaRuta creada: ${saved.codigo}`);
    return saved;
  }

  async findOne(id: string): Promise<HojaRuta> {
    const hr = await this.repo.findOne({
      where: { id },
      relations: ['derivaciones'],
    });
    if (!hr) throw new NotFoundException(`HojaRuta ${id} no encontrada`);
    return hr;
  }

  async cerrar(id: string): Promise<HojaRuta> {
    const hr = await this.findOne(id);
    if (hr.estado === EstadoHojaRuta.CERRADA || hr.estado === EstadoHojaRuta.ARCHIVADA) {
      throw new BadRequestException('La hoja de ruta ya está cerrada o archivada');
    }
    hr.estado = EstadoHojaRuta.CERRADA;
    const saved = await this.repo.save(hr);
    await this.finalizarDocumentosAsociados(id);
    return saved;
  }

  async archivar(id: string): Promise<HojaRuta> {
    const hr = await this.findOne(id);
    if (hr.estado === EstadoHojaRuta.ARCHIVADA) {
      throw new BadRequestException('La hoja de ruta ya está archivada');
    }
    hr.estado = EstadoHojaRuta.ARCHIVADA;
    const saved = await this.repo.save(hr);
    await this.finalizarDocumentosAsociados(id);
    return saved;
  }

  private async finalizarDocumentosAsociados(hojaRutaId: string) {
    try {
      await axios.post(`http://localhost:3002/documentos/finalizar-por-hoja/${hojaRutaId}`);
      this.logger.log(`Documentos finalizados para HR ${hojaRutaId}`);
    } catch (error) {
      this.logger.error(`Error finalizando documentos para HR ${hojaRutaId}`, error);
    }
  }

  private async generarCodigo(area: string, anio: number): Promise<string> {
    const count = await this.repo.count({
      where: { area_origen: area },
    });
    const numeral = String(count + 1).padStart(4, '0');
    return `HR-${area}-${numeral}-${anio}`;
  }
}
