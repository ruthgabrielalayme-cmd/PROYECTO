import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorrelativoSite } from './correlativo-site.entity';
import { CorrelativosService } from './correlativos.service';
import { CorrelativosController } from './correlativos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CorrelativoSite])],
  providers: [CorrelativosService],
  controllers: [CorrelativosController], 
  exports: [CorrelativosService],
})
export class CorrelativosModule {}
