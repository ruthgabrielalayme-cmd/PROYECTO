import { Controller, Get, Param, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { HojasRutaService } from '../hojas-ruta/hojas-ruta.service';
import { DerivacionesService } from '../derivaciones/derivaciones.service';

@Controller('trazabilidad')
export class TrazabilidadController {
  private readonly logger = new Logger(TrazabilidadController.name);
  private readonly documentosUrl: string;
  private readonly internalToken: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    private readonly hojasRutaService: HojasRutaService,
    private readonly derivacionesService: DerivacionesService,
  ) {
    this.documentosUrl = this.config.get<string>('DOCUMENTOS_URL') || this.config.get<string>('DOCUMENTOS_SERVICE_URL') || 'http://localhost:3002';
    this.internalToken = this.config.get<string>('INTERNAL_API_SECRET') || 'reemplaza_con_un_secret_largo_y_seguro';
  }

  @Get(':qrId')
  async consultarPorQr(@Param('qrId') qrId: string) {
    let documentoData;
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.documentosUrl}/documentos/publico/por-qr/${qrId}`, {
          headers: { 'X-Internal-Token': this.internalToken },
        }),
      );
      documentoData = response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`Error consultando QR ${qrId}: ${message}`);
      throw new NotFoundException('No se encontró ningún documento con ese código QR.');
    }

    let hoja_ruta;
    try {
      // Find the derivacion linked to this document to get the hoja_ruta
      const derivaciones = await this.derivacionesService.findByDocumentoId(documentoData.id);
      if (derivaciones.length > 0) {
        hoja_ruta = await this.hojasRutaService.findOne(derivaciones[0].hoja_ruta.id);
      }
    } catch(error: unknown) {
        this.logger.warn(`Could not fetch hoja de ruta for document ${documentoData.id}`);
    }

    return {
      qr_id: qrId,
      documento: documentoData,
      hoja_ruta,
    };
  }
}