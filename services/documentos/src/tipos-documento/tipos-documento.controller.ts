import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { TiposDocumentoService } from './tipos-documento.service';
import { CreateTipoDocumentoDto } from './tipo-documento.dto';

@Controller('tipos-documento')
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
  create(@Body() dto: CreateTipoDocumentoDto) {
    return this.service.create(dto);
  }
}
