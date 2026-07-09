import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Derivacion } from './derivacion.entity';
import { DerivacionesService } from './derivaciones.service';
import { DerivacionesController } from './derivaciones.controller';
import { HojasRutaModule } from '../hojas-ruta/hojas-ruta.module';
import { BandejasModule } from '../bandejas/bandejas.module';
import { HttpModule } from '@nestjs/axios';
@Module({
  imports: [
    TypeOrmModule.forFeature([Derivacion]),
    HojasRutaModule,
    BandejasModule,
    HttpModule,
  ],
  providers: [DerivacionesService],
  controllers: [DerivacionesController],
})
export class DerivacionesModule {}
