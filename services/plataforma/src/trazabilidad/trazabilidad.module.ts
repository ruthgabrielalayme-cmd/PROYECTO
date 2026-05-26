import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TrazabilidadController } from './trazabilidad.controller';

@Module({
  imports: [HttpModule],
  controllers: [TrazabilidadController],
})
export class TrazabilidadModule {}