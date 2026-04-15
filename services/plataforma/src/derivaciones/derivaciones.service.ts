import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Derivacion, EstadoDerivacion } from './derivacion.entity';
import { HojasRutaService } from '../hojas-ruta/hojas-ruta.service';
import { BandejasService } from '../bandejas/bandejas.service';
import { CreateDerivacionDto } from './derivacion.dto';
import { TipoBandeja } from '../bandejas/bandeja.entity';

@Injectable()
export class DerivacionesService {
  private readonly logger = new Logger(DerivacionesService.name);

  constructor(
    @InjectRepository(Derivacion)
    private readonly repo: Repository<Derivacion>,
    private readonly hojasRutaService: HojasRutaService,
    private readonly bandejasService: BandejasService,
  ) {}

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

    if (dto.es_externa) {
      // Notificar al encargado del área (en este contexto se asume que
      // remitente_id lleva info suficiente; en producción consultaría svc_usuarios)
      await this.bandejasService.crear({
        usuario_id: dto.remitente_id, // encargado del área de origen
        hoja_ruta: hojaRuta,
        tipo: TipoBandeja.PENDIENTE_APROBACION,
      });
      this.logger.log(`Derivación externa ${saved.id} → PENDIENTE_APROBACION`);
    } else {
      await this.bandejasService.crear({
        usuario_id: dto.destinatario_id,
        hoja_ruta: hojaRuta,
        tipo: TipoBandeja.ENTRANTE,
      });
      // Bandeja saliente para el remitente
      await this.bandejasService.crear({
        usuario_id: dto.remitente_id,
        hoja_ruta: hojaRuta,
        tipo: TipoBandeja.SALIENTE,
      });
      this.logger.log(`Derivación interna ${saved.id} → ENVIADA`);
    }

    return saved;
  }

  async aprobar(id: string): Promise<Derivacion> {
    const derivacion = await this.findOne(id);

    if (derivacion.estado !== EstadoDerivacion.PENDIENTE_APROBACION) {
      throw new BadRequestException(
        'Solo se pueden aprobar derivaciones en estado PENDIENTE_APROBACION',
      );
    }

    derivacion.estado = EstadoDerivacion.APROBADA;
    const saved = await this.repo.save(derivacion);

    // Transición automática a ENVIADA y notificación al destinatario
    saved.estado = EstadoDerivacion.ENVIADA;
    const enviada = await this.repo.save(saved);

    await this.bandejasService.crear({
      usuario_id: derivacion.destinatario_id,
      hoja_ruta: derivacion.hoja_ruta,
      tipo: TipoBandeja.ENTRANTE,
    });

    this.logger.log(`Derivación ${id} aprobada → ENVIADA`);
    return enviada;
  }

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

    // Notificar al remitente (bandeja ENTRANTE con la info del rechazo)
    await this.bandejasService.crear({
      usuario_id: derivacion.remitente_id,
      hoja_ruta: derivacion.hoja_ruta,
      tipo: TipoBandeja.ENTRANTE,
    });

    this.logger.log(`Derivación ${id} rechazada`);
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
}
