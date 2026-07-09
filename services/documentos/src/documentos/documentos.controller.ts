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
import { CreateDocumentoDto, SubirPdfDto, EvaluarBorradorDto } from './documento.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { EstadoDocumento } from './documento.entity';

@Controller('documentos')
@UseGuards(JwtAuthGuard, RolesGuard)
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
   * POST /documentos/:id/subir-word
   * Sube el archivo Word en fase de borrador
   */
  @Post(':id/subir-word')
  @UseInterceptors(FileInterceptor('file'))
  async subirWord(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    const validMimes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!validMimes.includes(file.mimetype)) {
      throw new BadRequestException('Solo se aceptan archivos Word (.doc, .docx)');
    }

    return this.documentosService.subirWord(id, file.buffer, file.originalname);
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
   * PATCH /documentos/:id/evaluar
   * Permite al encargado aprobar o rechazar un borrador
   */
  @Patch(':id/evaluar')
  @Roles('ENCARGADO')
  async evaluarBorrador(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EvaluarBorradorDto,
  ) {
    return this.documentosService.evaluarBorrador(id, dto.accion, dto.observaciones);
  }

  /**
   * GET /documentos/:id/pdf
   * Retorna el archivo PDF asociado al documento.
   */
  @Get(':id/pdf')
  async getPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    const doc = await this.documentosService.findOne(id);
    if (!doc.archivo_path) {
      throw new BadRequestException('El documento no tiene un PDF subido');
    }

    const absolutePath = path.resolve(doc.archivo_path);
    if (!fs.existsSync(absolutePath)) {
      throw new BadRequestException('Archivo PDF no encontrado en el servidor');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${doc.nombre_archivo}"`);
    res.sendFile(absolutePath);
  }

  }