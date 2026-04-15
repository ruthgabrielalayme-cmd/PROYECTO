import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HojaRuta } from './hoja-ruta.entity';
import { HojasRutaService } from './hojas-ruta.service';
import { HojasRutaController } from './hojas-ruta.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HojaRuta])],
  providers: [HojasRutaService],
  controllers: [HojasRutaController],
  exports: [HojasRutaService],
})
export class HojasRutaModule {}
