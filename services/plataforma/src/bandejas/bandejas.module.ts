import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bandeja } from './bandeja.entity';
import { BandejasService } from './bandejas.service';
import { BandejasController } from './bandejas.controller';
import { HttpModule } from '@nestjs/axios';
import { DerivacionesModule } from '../derivaciones/derivaciones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bandeja]),
    HttpModule,
    forwardRef(() => DerivacionesModule)
  ],
  providers: [BandejasService],
  controllers: [BandejasController],
  exports: [BandejasService],
})
export class BandejasModule {}
