import { Test, TestingModule } from '@nestjs/testing';
import { UsuariosService } from './usuarios.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Usuario, Rol, EstadoUsuario } from './usuario.entity';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let repo: any;

  beforeEach(async () => {
    const mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      }),
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: getRepositoryToken(Usuario), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
    repo = module.get(getRepositoryToken(Usuario));
  });

  describe('findAll', () => {
    let qb: any;
    beforeEach(() => {
      qb = repo.createQueryBuilder();
    });

    it('ADMIN sin búsqueda: retorna todos (sin añadir filtros al query builder)', async () => {
      await service.findAll({ rol: Rol.ADMIN, area: null });
      expect(qb.andWhere).not.toHaveBeenCalled();
      expect(qb.getMany).toHaveBeenCalled();
    });

    it('ADMIN con búsqueda: añade filtro search global', async () => {
      await service.findAll({ rol: Rol.ADMIN, area: null }, 'carlos');
      expect(qb.andWhere).toHaveBeenCalledWith('usuario.nombre_completo LIKE :search', { search: '%carlos%' });
      expect(qb.getMany).toHaveBeenCalled();
    });

    it('FUNCIONARIO sin búsqueda: restringe a su área', async () => {
      await service.findAll({ rol: Rol.FUNCIONARIO, area: 'DAF' });
      expect(qb.andWhere).toHaveBeenCalledWith('usuario.area = :area', { area: 'DAF' });
      expect(qb.getMany).toHaveBeenCalled();
    });

    it('FUNCIONARIO con búsqueda: permite buscar globalmente pero solo activos', async () => {
      await service.findAll({ rol: Rol.FUNCIONARIO, area: 'DAF' }, 'juan');
      expect(qb.andWhere).toHaveBeenCalledWith('usuario.nombre_completo LIKE :search', { search: '%juan%' });
      expect(qb.andWhere).toHaveBeenCalledWith('usuario.estado = :estado', { estado: EstadoUsuario.ACTIVO });
      expect(qb.getMany).toHaveBeenCalled();
    });

    it('FUNCIONARIO sin búsqueda y sin área: retorna 0 resultados (seguridad)', async () => {
      await service.findAll({ rol: Rol.FUNCIONARIO, area: null });
      expect(qb.andWhere).toHaveBeenCalledWith('1 = 0');
      expect(qb.getMany).toHaveBeenCalled();
    });
  });
});
