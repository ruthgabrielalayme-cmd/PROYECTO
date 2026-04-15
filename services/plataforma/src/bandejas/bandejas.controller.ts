import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { IsEnum, IsOptional } from 'class-validator';
import { BandejasService } from './bandejas.service';
import { TipoBandeja } from './bandeja.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

class BandejaQueryDto {
  @IsOptional()
  @IsEnum(TipoBandeja)
  tipo?: TipoBandeja;
}

@Controller('bandejas')
@UseGuards(JwtAuthGuard)
export class BandejasController {
  constructor(private readonly service: BandejasService) {}

  /**
   * GET /bandejas/:usuario_id?tipo=ENTRANTE|SALIENTE|PENDIENTE_APROBACION
   */
  @Get(':usuario_id')
  findByUsuario(
    @Param('usuario_id', ParseUUIDPipe) usuarioId: string,
    @Query() query: BandejaQueryDto,
  ) {
    return this.service.findByUsuario(usuarioId, query.tipo);
  }
}
