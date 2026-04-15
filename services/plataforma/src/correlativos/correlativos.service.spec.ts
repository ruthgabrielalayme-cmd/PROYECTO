import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CorrelativosService } from './correlativos.service';
import { CorrelativoSite } from './correlativo-site.entity';

describe('CorrelativosService', () => {
  let service: CorrelativosService;

  /**
   * Simula el comportamiento transaccional: mantiene un map en memoria
   * que representa la tabla correlativos_site.
   */
  const correlativosDb = new Map<string, CorrelativoSite>();

  const mockDataSource = {
    transaction: jest.fn(async (cb: (manager: unknown) => Promise<string>) => {
      // Mock del manager que simula SELECT FOR UPDATE
      const manager = {
        getRepository: () => ({
          createQueryBuilder: (alias: string) => ({
            setLock: () => ({
              where: (_cond: string, params: { area: string; anio: number }) => ({
                getOne: async () => {
                  const key = `${params.area}-${params.anio}`;
                  return correlativosDb.get(key) ?? null;
                },
              }),
            }),
          }),
          create: (data: Partial<CorrelativoSite>) => ({ ...data } as CorrelativoSite),
          save: async (entity: CorrelativoSite) => {
            const key = `${entity.area}-${entity.anio}`;
            correlativosDb.set(key, { ...entity });
            return entity;
          },
        }),
      };
      return cb(manager);
    }),
  };

  beforeEach(async () => {
    correlativosDb.clear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CorrelativosService,
        {
          provide: getRepositoryToken(CorrelativoSite),
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<CorrelativosService>(CorrelativosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── Test 1: Primer site del área+año ────────────────────────────────────

  it('debería generar el primer site correctamente', async () => {
    const site = await service.generarSite('DAF', 2026);
    expect(site).toBe('DAF-0001/2026');
  });

  // ─── Test 2: Sites consecutivos son únicos ───────────────────────────────

  it('debería generar dos sites únicos para el mismo area+año', async () => {
    const site1 = await service.generarSite('DAF', 2026);
    const site2 = await service.generarSite('DAF', 2026);

    expect(site1).toBe('DAF-0001/2026');
    expect(site2).toBe('DAF-0002/2026');
    expect(site1).not.toBe(site2);
  });

  // ─── Test 3: Sites de áreas distintas son independientes ─────────────────

  it('debería mantener contadores independientes por área', async () => {
    const daf1 = await service.generarSite('DAF', 2026);
    const rrhh1 = await service.generarSite('RRHH', 2026);
    const daf2 = await service.generarSite('DAF', 2026);

    expect(daf1).toBe('DAF-0001/2026');
    expect(rrhh1).toBe('RRHH-0001/2026');
    expect(daf2).toBe('DAF-0002/2026');
  });

  // ─── Test 4: Contadores se reinician entre años ───────────────────────────

  it('debería reiniciar el contador entre años distintos', async () => {
    const site2025 = await service.generarSite('DAF', 2025);
    const site2026 = await service.generarSite('DAF', 2026);

    expect(site2025).toBe('DAF-0001/2025');
    expect(site2026).toBe('DAF-0001/2026');
  });

  // ─── Test 5: Numeral se rellena con ceros hasta 4 dígitos ────────────────

  it('debería formatear el numeral con padding de 4 dígitos', async () => {
    // Generar 10 sites
    for (let i = 0; i < 9; i++) {
      await service.generarSite('LEGAL', 2026);
    }
    const decimo = await service.generarSite('LEGAL', 2026);
    expect(decimo).toBe('LEGAL-0010/2026');
  });
});
