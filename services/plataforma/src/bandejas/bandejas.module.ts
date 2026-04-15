import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bandeja } from './bandeja.entity';
import { BandejasService } from './bandejas.service';
import { BandejasController } from './bandejas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Bandeja])],
  providers: [BandejasService],
  controllers: [BandejasController],
  exports: [BandejasService],
})
export class BandejasModule {}
