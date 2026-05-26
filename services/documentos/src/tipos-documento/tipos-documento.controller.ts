import { Controller, Get, Post, Body, Param, ParseUUIDPipe, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { TiposDocumentoService } from './tipos-documento.service';
import { CreateTipoDocumentoDto } from './tipo-documento.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('tipos-documento')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TiposDocumentoController {
  constructor(private readonly service: TiposDocumentoService) {}

  @Get()
  @Roles('ADMIN', 'ENCARGADO', 'FUNCIONARIO')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'ENCARGADO', 'FUNCIONARIO')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateTipoDocumentoDto) {
    // El DTO solo tiene 'nombre' (ya no tiene plantilla_path)
    return this.service.create(dto);
  }

  @Post(':id/plantilla')
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('archivo', {
    storage: diskStorage({
      destination: './storage/plantillas', // carpeta donde se guardarán
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(docx|doc)$/)) {
        return cb(new BadRequestException('Solo archivos Word (.docx, .doc)'), false);
      }
      cb(null, true);
    },
  }))
  async uploadPlantilla(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    // Guardar la ruta relativa en la base de datos
    const rutaRelativa = file.path; // ej: storage/plantillas/123456.docx
    await this.service.actualizarPlantilla(id, rutaRelativa);
    return { message: 'Plantilla subida correctamente', path: rutaRelativa };
  }
}
