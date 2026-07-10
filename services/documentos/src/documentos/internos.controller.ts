import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe, Patch, Body, BadRequestException } from '@nestjs/common';
import { EstadoDocumento } from './documento.entity';
import { DocumentosService } from './documentos.service';
import { InternalGuard } from '../guards/internal.guard';

@Controller('documentos/internos')
@UseGuards(InternalGuard)
export class DocumentosInternosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Get('revisiones-pendientes')
  async findRevisionesPendientes(@Query('area') area: string) {
    if (!area) {
      throw new BadRequestException('Se requiere el área para buscar revisiones pendientes');
    }
    return this.documentosService.findRevisionesPendientes(area);
  }

  @Get(':id')
  async findOneInternal(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentosService.findOne(id);
  }

  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('estado') nuevoEstado: EstadoDocumento,
  ) {
    if (!Object.values(EstadoDocumento).includes(nuevoEstado)) {
      throw new BadRequestException('Estado no válido');
    }
    return this.documentosService.cambiarEstado(id, nuevoEstado);
  }
}
