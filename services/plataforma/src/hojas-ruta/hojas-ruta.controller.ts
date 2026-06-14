import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { HojasRutaService } from './hojas-ruta.service';
import { CreateHojaRutaDto } from './hoja-ruta.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('hojas-ruta')
@UseGuards(JwtAuthGuard)
export class HojasRutaController {
  constructor(private readonly service: HojasRutaService) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.service.findAll(req.user as any);
  }

  @Post()
  create(@Body() dto: CreateHojaRutaDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/cerrar')
  @UseGuards(RolesGuard)
  @Roles('ENCARGADO', 'ADMIN')
  cerrar(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.cerrar(id);
  }

  @Patch(':id/archivar')
  @UseGuards(RolesGuard)
  @Roles('ENCARGADO', 'ADMIN')
  archivar(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.archivar(id);
  }
}
