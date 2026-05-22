import { Controller, Get, Query, UseGuards, ForbiddenException, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CorrelativosService } from './correlativos.service';

@Controller('correlativos')
@UseGuards(JwtAuthGuard)
export class CorrelativosController {
    constructor(private readonly service: CorrelativosService) {}

    /**
     * GET /correlativos/generar-site?area=DAF&anio=2026
     * Retorna un site único y correlativo.
     * - ADMIN puede generar para cualquier área.
     * - Otros roles solo pueden generar para su propia área (según el campo `area` del token).
     */
    @Get('generar-site')
    async generarSite(
        @Query('area') area: string,
        @Query('anio') anioStr: string,
        @Req() req: any,
    ) {
        const user = req.user; // Asumiendo que JwtAuthGuard añade { id, rol, area, ... }

        if (!area) {
        throw new ForbiddenException('El parámetro "area" es obligatorio');
        }

        let anio = new Date().getFullYear();
        if (anioStr && !isNaN(parseInt(anioStr))) {
        anio = parseInt(anioStr);
        }

        // Validar permisos: ADMIN puede generar para cualquier área; otros solo para su área
        if (user.rol !== 'ADMIN' && user.area !== area) {
        throw new ForbiddenException(`No tienes permiso para generar site para el área ${area}`);
        }

        const site = await this.service.generarSite(area, anio);
        return { site };
    }
    }