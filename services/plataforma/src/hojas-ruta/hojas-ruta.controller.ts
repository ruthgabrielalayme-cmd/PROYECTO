import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { HojasRutaService } from './hojas-ruta.service';
import { CreateHojaRutaDto } from './hoja-ruta.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('hojas-ruta')
@UseGuards(JwtAuthGuard)
export class HojasRutaController {
  constructor(private readonly service: HojasRutaService) {}

  @Post()
  create(@Body() dto: CreateHojaRutaDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }
}
