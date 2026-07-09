import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Module,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Derivacion, EstadoDerivacion } from './derivacion.entity';
import { HojasRutaService } from '../hojas-ruta/hojas-ruta.service';
import { BandejasService } from '../bandejas/bandejas.service';
import { CreateDerivacionDto } from './derivacion.dto';
import { TipoBandeja } from '../bandejas/bandeja.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EstadoHojaRuta } from '../hojas-ruta/hoja-ruta.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DerivacionesService {
  private readonly logger = new Logger(DerivacionesService.name);
  private readonly documentosUrl: string;
  private readonly usuariosUrl: string;
  private readonly internalToken: string;

  constructor(
    @InjectRepository(Derivacion)
    private readonly repo: Repository<Derivacion>,
    private readonly hojasRutaService: HojasRutaService,
    private readonly bandejasService: BandejasService,
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    // Dentro del constructor de DerivacionesService
    this.documentosUrl = this.config.get<string>('DOCUMENTOS_URL') || this.config.get<string>('DOCUMENTOS_SERVICE_URL')!;
    this.usuariosUrl = this.config.get<string>('USUARIOS_URL') || this.config.get<string>('USUARIOS_SERVICE_URL')!;
    this.internalToken = this.config.get<string>('INTERNAL_API_SECRET')!;  // ← nombre correcto
    if (!this.documentosUrl || !this.usuariosUrl || !this.internalToken) {
      this.logger.error('Faltan configuraciones: DOCUMENTOS_URL, USUARIOS_URL o INTERNAL_API_SECRET');
    }
  }

  async create(dto: CreateDerivacionDto): Promise<Derivacion> {
    const hojaRuta = await this.hojasRutaService.findOne(dto.hoja_ruta_id);

    const derivacion = this.repo.create({
      hoja_ruta: hojaRuta,
      documento_id: dto.documento_id,
      remitente_id: dto.remitente_id,
      destinatario_id: dto.destinatario_id,
      es_externa: dto.es_externa,
      nota: dto.nota ?? null,
    });

    if (dto.es_externa) {
      // Derivación externa → PENDIENTE_APROBACION, va a bandeja del encargado
      derivacion.estado = EstadoDerivacion.PENDIENTE_APROBACION;
    } else {
      // Derivación interna → ENVIADA directamente, va a bandeja del destinatario
      derivacion.estado = EstadoDerivacion.ENVIADA;
    }

    const saved = await this.repo.save(derivacion);

      // Si es interna, el documento pasa a EN_FLUJO y la HR a EN_PROCESO
      if (!dto.es_externa) {
        await this.cambiarEstadoDocumento(dto.documento_id, 'EN_FLUJO');
        await this.actualizarEstadoHojaRuta(hojaRuta.id);
      }

      // Crear bandejas
      if (dto.es_externa) {
        let encargadoId = dto.remitente_id; // Fallback

        try {
          // Intentar obtener el área del remitente
          const remitenteRes = await firstValueFrom(
            this.httpService.get(`${this.usuariosUrl}/usuarios/${dto.remitente_id}`, {
              headers: { 'X-Internal-Token': this.internalToken },
            })
          ).catch(() => null);

          if (remitenteRes?.data?.area) {
             const encargadoRes = await firstValueFrom(
               this.httpService.get(`${this.usuariosUrl}/usuarios/internos/encargado/${remitenteRes.data.area}`, {
                 headers: { 'X-Internal-Token': this.internalToken },
               })
             ).catch(() => null);

             if (encargadoRes?.data?.id) {
                encargadoId = encargadoRes.data.id;
             }
          }
        } catch (error) {
          this.logger.error(`Error al buscar encargado: ${error}`);
        }

        await this.bandejasService.crear({
          usuario_id: encargadoId, // Asignado al encargado
          hoja_ruta: hojaRuta,
          tipo: TipoBandeja.PENDIENTE_APROBACION,
        });

        // Crear bandeja SALIENTE para el remitente
        await this.bandejasService.crear({
          usuario_id: dto.remitente_id,
          hoja_ruta: hojaRuta,
          tipo: TipoBandeja.SALIENTE,
        });

        this.logger.log(`Derivación externa ${saved.id} → PENDIENTE_APROBACION (Encargado: ${encargadoId}) y SALIENTE`);
      } else {
        await this.bandejasService.crear({
          usuario_id: dto.destinatario_id,
          hoja_ruta: hojaRuta,
          tipo: TipoBandeja.ENTRANTE,
        });
        await this.bandejasService.crear({
          usuario_id: dto.remitente_id,
          hoja_ruta: hojaRuta,
          tipo: TipoBandeja.SALIENTE,
        });
        this.logger.log(`Derivación interna ${saved.id} → ENVIADA`);
      }

      return saved;
    }

  // ─── Aprobar derivación externa ─────────────────────────────────────────
  async aprobar(id: string): Promise<Derivacion> {
    const derivacion = await this.findOne(id);

    if (derivacion.estado !== EstadoDerivacion.PENDIENTE_APROBACION) {
      throw new BadRequestException(
        'Solo se pueden aprobar derivaciones en estado PENDIENTE_APROBACION',
      );
    }

    derivacion.estado = EstadoDerivacion.APROBADA;
    const saved = await this.repo.save(derivacion);

    // Transición automática a ENVIADA
    saved.estado = EstadoDerivacion.ENVIADA;
    const enviada = await this.repo.save(saved);

    // Una vez enviada, el documento pasa a EN_FLUJO y la HR a EN_PROCESO
    await this.cambiarEstadoDocumento(derivacion.documento_id, 'EN_FLUJO');
    await this.actualizarEstadoHojaRuta(derivacion.hoja_ruta.id);

    await this.bandejasService.crear({
      usuario_id: derivacion.destinatario_id,
      hoja_ruta: derivacion.hoja_ruta,
      tipo: TipoBandeja.ENTRANTE,
    });

    this.logger.log(`Derivación ${id} aprobada → ENVIADA`);
    return enviada;
  }

  // ─── Rechazar derivación externa ────────────────────────────────────────
  async rechazar(id: string, motivo: string): Promise<Derivacion> {
    const derivacion = await this.findOne(id);

    if (derivacion.estado !== EstadoDerivacion.PENDIENTE_APROBACION) {
      throw new BadRequestException(
        'Solo se pueden rechazar derivaciones en estado PENDIENTE_APROBACION',
      );
    }

    derivacion.estado = EstadoDerivacion.RECHAZADA;
    derivacion.nota = motivo;
    const saved = await this.repo.save(derivacion);

    await this.bandejasService.crear({
      usuario_id: derivacion.remitente_id,
      hoja_ruta: derivacion.hoja_ruta,
      tipo: TipoBandeja.ENTRANTE,
    });

    this.logger.log(`Derivación ${id} rechazada`);
    return saved;
  }

  // ─── Recibir derivación ──────────────────────────────────────────────────
  async recibir(id: string): Promise<Derivacion> {
    const derivacion = await this.findOne(id);

    if (derivacion.estado !== EstadoDerivacion.ENVIADA) {
      throw new BadRequestException(
        'Solo se pueden recibir derivaciones en estado ENVIADA',
      );
    }

    derivacion.estado = EstadoDerivacion.RECIBIDA;
    const saved = await this.repo.save(derivacion);

    this.logger.log(`Derivación ${id} recibida`);
    return saved;
  }


  private async findOne(id: string): Promise<Derivacion> {
    const d = await this.repo.findOne({
      where: { id },
      relations: ['hoja_ruta'],
    });
    if (!d) throw new NotFoundException(`Derivacion ${id} no encontrada`);
    return d;
  }

  async findByDocumentoId(documentoId: string): Promise<Derivacion[]> {
    return this.repo.find({
      where: { documento_id: documentoId },
      relations: ['hoja_ruta'],
    });
  }
  
    // ─── Cambiar estado del documento en svc_documentos (con token interno) ──
  private async cambiarEstadoDocumento(documentoId: string, nuevoEstado: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.patch(
          `${this.documentosUrl}/documentos/${documentoId}/estado`,
          { estado: nuevoEstado },
          {
            headers: {
              'X-Internal-Token': this.internalToken,
            },
          },
        ),
      );
      this.logger.log(`Documento ${documentoId} cambiado a ${nuevoEstado}`);
    } catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  this.logger.error(`Error al cambiar estado del documento ${documentoId}: ${message}`);
}
  }

    private async actualizarEstadoHojaRuta(hojaRutaId: string): Promise<void> {
    const hr = await this.hojasRutaService.findOne(hojaRutaId);
    if (hr.estado === EstadoHojaRuta.ABIERTA) {
      hr.estado = EstadoHojaRuta.EN_PROCESO;
      await this.hojasRutaService.save(hr);
      this.logger.log(`HojaRuta ${hojaRutaId} actualizada a EN_PROCESO`);
    }
  }
}
