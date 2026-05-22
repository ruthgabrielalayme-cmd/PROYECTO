import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  Req,
  Patch,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { HojasRutaService } from './hojas-ruta.service';
import { CreateHojaRutaDto } from './hoja-ruta.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { EstadoHojaRuta } from './hoja-ruta.entity';
@Controller('hojas-ruta')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HojasRutaController {
  constructor(private readonly service: HojasRutaService) {}

  @Get()
  async findAll(@Req() req: any) {
    const user = req.user; // { id, rol, area }
    return this.service.findAllByUser(user);
  }

  @Post()
  @Roles('FUNCIONARIO', 'ENCARGADO', 'ADMIN')  // todos pueden crear, pero con restricción
  async create(@Body() dto: CreateHojaRutaDto, @Req() req: any) {
    const user = req.user;
    // Si no es ADMIN, debe crear HR para su propia área
    if (user.rol !== 'ADMIN' && user.area !== dto.area_origen) {
      throw new ForbiddenException(`No puedes crear una hoja de ruta para el área ${dto.area_origen}. Tu área es ${user.area}.`);
    }
    return this.service.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }
  
  @Patch(':id/estado')
  @Roles('ADMIN')
  async cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('estado') nuevoEstado: EstadoHojaRuta,
  ) {
    if (!Object.values(EstadoHojaRuta).includes(nuevoEstado)) {
      throw new BadRequestException('Estado no válido');
    }
    return this.service.cambiarEstado(id, nuevoEstado);
  }
}
