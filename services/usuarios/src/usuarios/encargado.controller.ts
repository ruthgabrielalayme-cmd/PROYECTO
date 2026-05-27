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
    const todos = await this.usuariosService.findAll();
    return todos.find(u => u.area === area && u.rol === Rol.ENCARGADO && u.estado === EstadoUsuario.ACTIVO);
  }
}
