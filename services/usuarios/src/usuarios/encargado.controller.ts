import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { InternalGuard } from '../guards/internal.guard';
import { Rol, EstadoUsuario } from './usuario.entity';

@Controller('usuarios/internos')
@UseGuards(InternalGuard)
export class EncargadoController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get('encargado/:area')
  async findEncargadoByArea(@Param('area') area: string) {
    // Para endpoints internos, buscamos con rol ADMIN para que no haya filtro de área por defecto
    const todos = await this.usuariosService.findAll({ rol: Rol.ADMIN, area: null });
    return todos.find(u => u.area === area && u.rol === Rol.ENCARGADO && u.estado === EstadoUsuario.ACTIVO);
  }

  @Get(':id')
  async findOneInternal(@Param('id') id: string) {
    return this.usuariosService.findOne(id);
  }
}
