import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  Res,
  BadRequestException,
  UseGuards,
  Patch,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { DocumentosService } from './documentos.service';
import { CreateDocumentoDto, SubirPdfDto } from './documento.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { EstadoDocumento } from './documento.entity';
import { InternalGuard } from '../guards/internal.guard';
@Controller('documentos')
@UseGuards(JwtAuthGuard)
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  /**
   * GET /documentos/plantilla/:tipo_id
   * Descarga la plantilla del tipo de documento.
   */
  @Get('plantilla/:tipo_id')
  async descargarPlantilla(
    @Param('tipo_id', ParseUUIDPipe) tipoId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { filePath, fileName } = await this.documentosService.obtenerRutaPlantilla(tipoId);

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );

    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      throw new BadRequestException('Archivo de plantilla no encontrado en el servidor');
    }

    res.sendFile(absolutePath);
  }

  /**
   * GET /documentos
   * Retorna todos los documentos.
   */
  @Get()
  async findAll(@Req() req: any) {
    const user = req.user; // viene del JWT (id, rol, area, ...)
    return this.documentosService.findAllByUser(user);
  }

  /**
   * POST /documentos
   * Crea un nuevo documento en estado BORRADOR.
   */
  @Post()
  async create(@Body() dto: CreateDocumentoDto, @Req() req: any) {
    const user = req.user; // { id, rol, area, ... }
    // Asignamos el área desde el token (si el usuario tiene área)
    if (user.area) {
      dto.area = user.area;
    }
    return this.documentosService.create(dto);
  }

  /**
   * POST /documentos/:id/subir-pdf
   * Sube el PDF definitivo, inserta el site y el QR, y almacena el archivo.
   * Requiere multipart/form-data con campo 'file' (PDF) y campo 'site'.
   */
  @Post(':id/subir-pdf')
  @UseInterceptors(FileInterceptor('file'))
  async subirPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: SubirPdfDto,
  ) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo PDF');
    }
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Solo se aceptan archivos PDF');
    }

    return this.documentosService.subirPdf(id, file.buffer, dto.site);
  }

  /**
   * GET /documentos/:id
   * Retorna los metadatos de un documento.
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentosService.findOne(id);
  }

  /**
   * PATCH /documentos/:id/estado
   * Cambia el estado de un documento.
   */
  @Patch(':id/estado')
  @UseGuards(InternalGuard)  // ← solo llamadas internas con token
  async cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('estado') nuevoEstado: EstadoDocumento,  // ← cambia de 'nuevoEstado' a 'estado'
  ) {
    if (!Object.values(EstadoDocumento).includes(nuevoEstado)) {
      throw new BadRequestException('Estado no válido');
    }
    return this.documentosService.cambiarEstado(id, nuevoEstado);
  }
}