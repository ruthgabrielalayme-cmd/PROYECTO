import { Controller, Get, Post, Body, Param, ParseUUIDPipe, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { TiposDocumentoService } from './tipos-documento.service';
import { CreateTipoDocumentoDto } from './tipo-documento.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('tipos-documento')
@UseGuards(JwtAuthGuard)
export class TiposDocumentoController {
  constructor(private readonly service: TiposDocumentoService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() dto: CreateTipoDocumentoDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    let plantilla_path = dto.plantilla_path;

    if (file) {
      if (file.mimetype !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        throw new BadRequestException('La plantilla debe ser un archivo .docx');
      }
      const storagePath = './plantillas';
      await fs.promises.mkdir(storagePath, { recursive: true });
      // Sanitize the filename to prevent directory traversal
      const safeOriginalName = path.basename(file.originalname);
      const fileName = `${Date.now()}-${safeOriginalName}`;
      plantilla_path = path.join(storagePath, fileName);
      await fs.promises.writeFile(plantilla_path, file.buffer);
    }

    return this.service.create({ ...dto, plantilla_path });
  }
}
