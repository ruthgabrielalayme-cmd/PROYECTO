import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoHojaRuta, HojaRuta } from './hoja-ruta.entity';
import { CreateHojaRutaDto } from './hoja-ruta.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HojasRutaService {
  save(hr: HojaRuta) {
    return this.repo.save(hr);
  }
  private readonly logger = new Logger(HojasRutaService.name);
  private readonly documentosUrl: string;
  private readonly usuariosUrl: string;
  private readonly internalToken: string;

  constructor(
    @InjectRepository(HojaRuta)
    private readonly repo: Repository<HojaRuta>,
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.documentosUrl = this.config.get<string>('DOCUMENTOS_URL') || this.config.get<string>('DOCUMENTOS_SERVICE_URL') || 'http://localhost:3002';
    this.usuariosUrl = this.config.get<string>('USUARIOS_URL') || this.config.get<string>('USUARIOS_SERVICE_URL') || 'http://localhost:3001';
    this.internalToken = this.config.get<string>('INTERNAL_API_SECRET') || 'reemplaza_con_un_secret_largo_y_seguro';
  }

  async enrichHojaRuta(hr: HojaRuta): Promise<HojaRuta> {
    const userIds = new Set<string>();
    const docIds = new Set<string>();

    userIds.add(hr.creado_por);

    if (hr.derivaciones) {
      for (const d of hr.derivaciones) {
        userIds.add(d.remitente_id);
        userIds.add(d.destinatario_id);
        docIds.add(d.documento_id);
      }
    }

    const userNames = new Map<string, string>();
    const docNames = new Map<string, string>();

    // Fetch users
    for (const userId of userIds) {
      if (!userId) continue;
      try {
        const res = await firstValueFrom(
          this.httpService.get(`${this.usuariosUrl}/usuarios/internos/${userId}`, {
            headers: { 'X-Internal-Token': this.internalToken },
          })
        );
        if (res.data?.nombre_completo) {
          userNames.set(userId, res.data.nombre_completo);
        }
      } catch (err) {
        this.logger.warn(`Could not fetch user name for ${userId}: ${(err as any).message} ${(err as any).response?.status}`);
      }
    }

    // Fetch documents
    for (const docId of docIds) {
      if (!docId) continue;
      try {
        const res = await firstValueFrom(
          this.httpService.get(`${this.documentosUrl}/documentos/internos/${docId}`, {
            headers: { 'X-Internal-Token': this.internalToken },
          })
        );
        if (res.data?.nombre_archivo) {
          docNames.set(docId, res.data.nombre_archivo);
        }
      } catch (err) {
        this.logger.warn(`Could not fetch document name for ${docId}: ${(err as any).message} ${(err as any).response?.status}`);
      }
    }

    // Attach names
    (hr as any).creado_por_nombre = userNames.get(hr.creado_por) || null;

    if (hr.derivaciones) {
      for (const d of hr.derivaciones) {
        (d as any).remitente_nombre = userNames.get(d.remitente_id) || null;
        (d as any).destinatario_nombre = userNames.get(d.destinatario_id) || null;
        (d as any).documento_nombre = docNames.get(d.documento_id) || null;
      }
    }

    return hr;
  }

  async updateEstado(id: string, nuevoEstado: EstadoHojaRuta): Promise<HojaRuta> {
  const hr = await this.findOne(id);
  hr.estado = nuevoEstado;
  return this.repo.save(hr);
}
  async findAllByUser(user: { id: string; rol: string; area: string | null }): Promise<HojaRuta[]> {
  const qb = this.repo.createQueryBuilder('hr')
    .leftJoinAndSelect('hr.derivaciones', 'derivaciones');

  let hojas: HojaRuta[] = [];
  if (user.rol === 'ADMIN') {
    // ADMIN ve todas
    hojas = await qb.getMany();
  } else if (user.rol === 'ENCARGADO') {
    // ENCARGADO ve las HR de su área (area_origen = user.area)
    if (!user.area) return [];
    qb.andWhere('hr.area_origen = :area', { area: user.area });
    hojas = await qb.getMany();
  } else {
    // FUNCIONARIO: HR de su área, o donde es creador, o está involucrado en alguna derivación
    qb.andWhere(
      '(hr.area_origen = :area OR hr.creado_por = :userId OR EXISTS (SELECT 1 FROM derivaciones d WHERE d.hoja_ruta_id = hr.id AND (d.remitente_id = :userId OR d.destinatario_id = :userId)))',
      { area: user.area, userId: user.id },
    );
    hojas = await qb.getMany();
  }

  return Promise.all(hojas.map(hr => this.enrichHojaRuta(hr)));
}
  async findAll(): Promise<HojaRuta[]> {
    const hojas = await this.repo.find({ relations: ['derivaciones'] });
    return Promise.all(hojas.map(hr => this.enrichHojaRuta(hr)));
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
    return this.enrichHojaRuta(hr);
  }

  async cambiarEstado(id: string, nuevoEstado: EstadoHojaRuta): Promise<HojaRuta> {
  const hr = await this.findOne(id);

  if (nuevoEstado === EstadoHojaRuta.CERRADA || nuevoEstado === EstadoHojaRuta.ARCHIVADA) {
    await this.finalizarDocumentos(hr);
  }

  hr.estado = nuevoEstado;
  const updated = await this.repo.save(hr);
  this.logger.log(`HojaRuta ${id} cambió estado a ${nuevoEstado}`);

  return updated;
}

  private async finalizarDocumentos(hr: HojaRuta) {
    if (!hr.derivaciones || hr.derivaciones.length === 0) return;

    // Extraer los IDs únicos de documentos en las derivaciones
    const docIds = [...new Set(hr.derivaciones.map(d => d.documento_id))];

    for (const docId of docIds) {
      try {
        await firstValueFrom(
          this.httpService.patch(
            `${this.documentosUrl}/documentos/internos/${docId}/estado`,
            { estado: 'FINALIZADO' },
            {
              headers: {
                'X-Internal-Token': this.internalToken,
              },
            },
          ),
        );
        this.logger.log(`Documento ${docId} cambiado a FINALIZADO tras cerrar HR ${hr.id}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Error al cambiar estado del documento ${docId} a FINALIZADO: ${message}`);
        // Lanzamos el error para que la actualización de estado falle y no se guarde la Hoja de Ruta
        throw new Error(`Fallo al finalizar documento ${docId}: ${message}`);
      }
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
