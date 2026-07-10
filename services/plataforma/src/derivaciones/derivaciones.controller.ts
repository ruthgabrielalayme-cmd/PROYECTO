import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { DerivacionesService } from './derivaciones.service';
import { CreateDerivacionDto, RechazarDerivacionDto } from './derivacion.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('derivaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DerivacionesController {
  constructor(private readonly service: DerivacionesService) {}

  @Post()
  @Roles('FUNCIONARIO', 'ENCARGADO', 'ADMIN')
  create(@Body() dto: CreateDerivacionDto) {
    return this.service.create(dto);
  }

  @Patch(':id/aprobar')
  @Roles('ENCARGADO', 'ADMIN')
  aprobar(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.aprobar(id);
  }

  @Patch(':id/rechazar')
  @Roles('ENCARGADO', 'ADMIN')
  rechazar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RechazarDerivacionDto,
  ) {
    return this.service.rechazar(id, dto.motivo);
  }

  @Patch(':id/recibir')
  recibir(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.recibir(id);
  }
}
