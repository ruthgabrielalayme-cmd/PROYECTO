import { Controller, Get, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { DocumentosService } from './documentos.service';
import { InternalGuard } from '../guards/internal.guard';

@Controller('documentos/internos')
@UseGuards(InternalGuard)
export class DocumentosInternosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Get(':id')
  async findOneInternal(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentosService.findOne(id);
  }
}
