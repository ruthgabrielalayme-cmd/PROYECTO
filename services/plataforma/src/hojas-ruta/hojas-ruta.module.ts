import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HojaRuta } from './hoja-ruta.entity';
import { HojasRutaService } from './hojas-ruta.service';
import { HojasRutaController } from './hojas-ruta.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TypeOrmModule.forFeature([HojaRuta]), HttpModule],
  providers: [HojasRutaService],
  controllers: [HojasRutaController],
  exports: [HojasRutaService],
})
export class HojasRutaModule {}
