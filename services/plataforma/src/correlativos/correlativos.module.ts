import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorrelativoSite } from './correlativo-site.entity';
import { CorrelativosService } from './correlativos.service';

@Module({
  imports: [TypeOrmModule.forFeature([CorrelativoSite])],
  providers: [CorrelativosService],
  exports: [CorrelativosService],
})
export class CorrelativosModule {}
