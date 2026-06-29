import { Controller, Get, Param, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Controller('trazabilidad')
export class TrazabilidadController {
  private readonly logger = new Logger(TrazabilidadController.name);
  private readonly documentosUrl: string;
  private readonly internalToken: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.documentosUrl = this.config.get<string>('DOCUMENTOS_URL') || this.config.get<string>('DOCUMENTOS_SERVICE_URL')!;
    this.internalToken = this.config.get<string>('INTERNAL_API_SECRET')!;
  }

  @Get(':qrId')
  async consultarPorQr(@Param('qrId') qrId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.documentosUrl}/documentos/publico/por-qr/${qrId}`, {
          headers: { 'X-Internal-Token': this.internalToken },
        }),
      );
      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`Error consultando QR ${qrId}: ${message}`);
      throw new NotFoundException('No se encontró ningún documento con ese código QR.');
    }
  }
}