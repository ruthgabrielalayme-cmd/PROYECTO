import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HojaRuta } from './hoja-ruta.entity';
import { CreateHojaRutaDto } from './hoja-ruta.dto';

@Injectable()
export class HojasRutaService {
  private readonly logger = new Logger(HojasRutaService.name);

  constructor(
    @InjectRepository(HojaRuta)
    private readonly repo: Repository<HojaRuta>,
  ) {}

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

  private async generarCodigo(area: string, anio: number): Promise<string> {
    const count = await this.repo.count({
      where: { area_origen: area },
    });
    const numeral = String(count + 1).padStart(4, '0');
    return `HR-${area}-${numeral}-${anio}`;
  }
}
