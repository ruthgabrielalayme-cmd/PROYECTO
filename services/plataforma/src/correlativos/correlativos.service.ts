import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CorrelativoSite } from './correlativo-site.entity';

@Injectable()
export class CorrelativosService {
  private readonly logger = new Logger(CorrelativosService.name);

  constructor(
    @InjectRepository(CorrelativoSite)
    private readonly repo: Repository<CorrelativoSite>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Genera un site único y correlativo para el área y año dados.
   * Usa una transacción con SELECT ... FOR UPDATE para evitar duplicados
   * en entornos de alta concurrencia.
   *
   * Formato resultante: <SIGLA_AREA>-<NUMERAL_4DIGITOS>/<AÑO>
   * Ejemplo: DAF-0042/2026
   */
  async generarSite(area: string, anio: number): Promise<string> {
    return this.dataSource.transaction(async (manager) => {
      // Bloquea la fila para escritura exclusiva
      let correlativo = await manager
        .getRepository(CorrelativoSite)
        .createQueryBuilder('c')
        .setLock('pessimistic_write')
        .where('c.area = :area AND c.anio = :anio', { area, anio })
        .getOne();

      if (!correlativo) {
        // Primera vez que se genera para este area+anio
        correlativo = manager.getRepository(CorrelativoSite).create({
          area,
          anio,
          ultimo: 0,
        });
      }

      correlativo.ultimo += 1;
      await manager.getRepository(CorrelativoSite).save(correlativo);

      const numeral = String(correlativo.ultimo).padStart(4, '0');
      const site = `${area}-${numeral}/${anio}`;

      this.logger.log(`Site generado: ${site}`);
      return site;
    });
  }
}
