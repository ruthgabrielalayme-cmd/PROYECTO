import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TrazabilidadController } from './trazabilidad.controller';
import { HojasRutaModule } from '../hojas-ruta/hojas-ruta.module';
import { DerivacionesModule } from '../derivaciones/derivaciones.module';

@Module({
  imports: [HttpModule, HojasRutaModule, DerivacionesModule],
  controllers: [TrazabilidadController],
})
export class TrazabilidadModule {}