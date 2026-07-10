import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { DocumentosService } from './documentos.service';

@Controller('documentos/publico')
export class DocumentosPublicosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Get('por-qr/:qrId')
  async findByQr(@Param('qrId') qrId: string) {
    return this.documentosService.findByQr(qrId);
  }
}
