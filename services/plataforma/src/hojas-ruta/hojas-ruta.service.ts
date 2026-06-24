import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoHojaRuta, HojaRuta } from './hoja-ruta.entity';
import { CreateHojaRutaDto } from './hoja-ruta.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HojasRutaService {
  save(hr: HojaRuta) {
    throw new Error('Method not implemented.');
  }
  private readonly logger = new Logger(HojasRutaService.name);
  private readonly documentosUrl: string;
  private readonly internalToken: string;

  constructor(
    @InjectRepository(HojaRuta)
    private readonly repo: Repository<HojaRuta>,
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.documentosUrl = this.config.get<string>('DOCUMENTOS_URL') || this.config.get<string>('DOCUMENTOS_SERVICE_URL')!;
    this.internalToken = this.config.get<string>('INTERNAL_API_SECRET')!;
  }

  async updateEstado(id: string, nuevoEstado: EstadoHojaRuta): Promise<HojaRuta> {
  const hr = await this.findOne(id);
  hr.estado = nuevoEstado;
  return this.repo.save(hr);
}
  async findAllByUser(user: { id: string; rol: string; area: string | null }): Promise<HojaRuta[]> {
  const qb = this.repo.createQueryBuilder('hr')
    .leftJoinAndSelect('hr.derivaciones', 'derivaciones');

  if (user.rol === 'ADMIN') {
    // ADMIN ve todas
    return qb.getMany();
  } else if (user.rol === 'ENCARGADO') {
    // ENCARGADO ve las HR de su área (area_origen = user.area)
    if (!user.area) return [];
    qb.andWhere('hr.area_origen = :area', { area: user.area });
    return qb.getMany();
  } else {
    // FUNCIONARIO: HR de su área, o donde es creador, o está involucrado en alguna derivación
    qb.andWhere(
      '(hr.area_origen = :area OR hr.creado_por = :userId OR EXISTS (SELECT 1 FROM derivaciones d WHERE d.hoja_ruta_id = hr.id AND (d.remitente_id = :userId OR d.destinatario_id = :userId)))',
      { area: user.area, userId: user.id },
    );
    return qb.getMany();
  }
}
  async findAll(): Promise<HojaRuta[]> {
    return this.repo.find({ relations: ['derivaciones'] });
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

  async cambiarEstado(id: string, nuevoEstado: EstadoHojaRuta): Promise<HojaRuta> {
  const hr = await this.findOne(id);
  hr.estado = nuevoEstado;
  const updated = await this.repo.save(hr);
  this.logger.log(`HojaRuta ${id} cambió estado a ${nuevoEstado}`);

  if (nuevoEstado === EstadoHojaRuta.CERRADA || nuevoEstado === EstadoHojaRuta.ARCHIVADA) {
    try {
      // Find all unique documents associated with this HR's derivations
      const docIds = [...new Set(hr.derivaciones?.map(d => d.documento_id) || [])];
      for (const docId of docIds) {
        await firstValueFrom(
          this.httpService.patch(
            `${this.documentosUrl}/documentos/${docId}/estado`,
            { estado: 'FINALIZADO' },
            {
              headers: {
                'X-Internal-Token': this.internalToken,
              },
            },
          ),
        );
      }
      this.logger.log(`Documentos asociados a HR ${id} finalizados.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error al finalizar documentos para HR ${id}: ${message}`);
    }
  }

  return updated;
}

  private async generarCodigo(area: string, anio: number): Promise<string> {
    const count = await this.repo.count({
      where: { area_origen: area },
    });
    const numeral = String(count + 1).padStart(4, '0');
    return `HR-${area}-${numeral}-${anio}`;
  }
}
