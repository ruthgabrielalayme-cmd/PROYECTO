import { Test, TestingModule } from '@nestjs/testing';
import { DerivacionesService } from './derivaciones.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Derivacion, EstadoDerivacion } from './derivacion.entity';
import { HojasRutaService } from '../hojas-ruta/hojas-ruta.service';
import { BandejasService } from '../bandejas/bandejas.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DerivacionesService', () => {
  let service: DerivacionesService;
  let repo: any;

  beforeEach(async () => {
    const mockRepo = {
      findOne: jest.fn(),
      save: jest.fn((d) => Promise.resolve(d)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DerivacionesService,
        { provide: getRepositoryToken(Derivacion), useValue: mockRepo },
        { provide: HojasRutaService, useValue: {} },
        { provide: BandejasService, useValue: {} },
        { provide: HttpService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<DerivacionesService>(DerivacionesService);
    repo = module.get(getRepositoryToken(Derivacion));
  });

  describe('recibir', () => {
    it('debería cambiar el estado a RECIBIDA si está ENVIADA', async () => {
      const derivacionMock = { id: '1', estado: EstadoDerivacion.ENVIADA };
      repo.findOne.mockResolvedValue(derivacionMock);

      const result = await service.recibir('1');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: '1' }, relations: ['hoja_ruta'] });
      expect(result.estado).toBe(EstadoDerivacion.RECIBIDA);
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ estado: EstadoDerivacion.RECIBIDA }));
    });

    it('debería lanzar BadRequestException si el estado no es ENVIADA', async () => {
      const derivacionMock = { id: '1', estado: EstadoDerivacion.PENDIENTE_APROBACION };
      repo.findOne.mockResolvedValue(derivacionMock);

      await expect(service.recibir('1')).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar NotFoundException si no se encuentra la derivacion', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.recibir('999')).rejects.toThrow(NotFoundException);
    });
  });
});
