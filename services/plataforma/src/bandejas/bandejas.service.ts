import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bandeja, TipoBandeja } from './bandeja.entity';
import { HojaRuta } from '../hojas-ruta/hoja-ruta.entity';

interface CrearBandejaParams {
  usuario_id: string;
  hoja_ruta: HojaRuta;
  tipo: TipoBandeja;
}

@Injectable()
export class BandejasService {
  private readonly logger = new Logger(BandejasService.name);

  constructor(
    @InjectRepository(Bandeja)
    private readonly repo: Repository<Bandeja>,
  ) {}

  async crear(params: CrearBandejaParams): Promise<Bandeja> {
    const bandeja = this.repo.create({
      usuario_id: params.usuario_id,
      hoja_ruta: params.hoja_ruta,
      tipo: params.tipo,
      leido: false,
    });
    return this.repo.save(bandeja);
  }

  async findByUsuario(
    usuarioId: string,
    tipo?: TipoBandeja,
  ): Promise<Bandeja[]> {
    const query = this.repo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.hoja_ruta', 'hr')
      .where('b.usuario_id = :usuarioId', { usuarioId });

    if (tipo) {
      query.andWhere('b.tipo = :tipo', { tipo });
    }

    return query.orderBy('b.created_at', 'DESC').getMany();
  }
}
