import { Controller, Get, Post, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { TiposDocumentoService } from './tipos-documento.service';
import { CreateTipoDocumentoDto } from './tipo-documento.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Rol } from '../usuarios/roles.enum';

@Controller('tipos-documento')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TiposDocumentoController {
  constructor(private readonly service: TiposDocumentoService) {}

  @Get()
  @Roles(Rol.ADMIN, Rol.ENCARGADO) // ambos pueden ver la lista
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(Rol.ADMIN, Rol.ENCARGADO, Rol.FUNCIONARIO) // cualquiera puede ver un tipo
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(Rol.ADMIN) // SOLO admin puede crear tipos nuevos
  create(@Body() dto: CreateTipoDocumentoDto) {
    return this.service.create(dto);
  }
}
