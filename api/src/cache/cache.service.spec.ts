import { Test, TestingModule } from '@nestjs/testing';
import { CacheService, CACHE_REDIS_CLIENT } from './cache.service';
import Redis from 'ioredis';

describe('CacheService', () => {
  let service: CacheService;
  let redisMock: Partial<Redis>;

  const mockRedisClient = {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    setnx: jest.fn(),
    expire: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Configura mocks padrão
    mockRedisClient.set.mockResolvedValue('OK');
    mockRedisClient.setex.mockResolvedValue('OK');
    mockRedisClient.setnx.mockResolvedValue(1);
    mockRedisClient.del.mockResolvedValue(1);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_REDIS_CLIENT,
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    redisMock = module.get<Redis>(CACHE_REDIS_CLIENT);
  });

  describe('generateKey (private method)', () => {
    it('deve gerar chave com prefixo correto', () => {
      // Acessando método privado via bracket notation para teste
      const key = (service as any).generateKey('test', 'param1', 'param2');
      expect(key).toBe('company_management:test:param1:param2');
    });

    it('deve gerar chave sem argumentos extras', () => {
      const key = (service as any).generateKey('test');
      expect(key).toBe('company_management:test');
    });

    it('deve filtrar valores falsy', () => {
      const key = (service as any).generateKey('test', '', 0, 'valid');
      expect(key).toBe('company_management:test:0:valid');
    });
  });

  describe('get', () => {
    it('deve retornar valor do cache quando existir (HIT)', async () => {
      const testData = { id: '1', name: 'Test' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));

      const result = await service.get('test-key');

      expect(result).toEqual(testData);
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
    });

    it('deve retornar null quando cache não existir (MISS)', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get('test-key');

      expect(result).toBeNull();
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
    });

    it('deve retornar null e logar erro quando Redis falhar', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis Down'));

      const result = await service.get('test-key');

      expect(result).toBeNull();
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
    });

    it('deve lidar com erro genérico (não Error)', async () => {
      mockRedisClient.get.mockRejectedValue('String error');

      const result = await service.get('test-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('deve salvar valor sem TTL', async () => {
      const testData = { id: '1', name: 'Test' };
      mockRedisClient.set.mockResolvedValue('OK');

      await service.set('test-key', testData);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testData),
      );
      expect(mockRedisClient.setex).not.toHaveBeenCalled();
    });

    it('deve salvar valor com TTL usando setex', async () => {
      const testData = { id: '1', name: 'Test' };
      mockRedisClient.setex.mockResolvedValue('OK');

      await service.set('test-key', testData, 300);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'test-key',
        300,
        JSON.stringify(testData),
      );
    });

    it('deve logar erro mas não lançar exceção quando falhar', async () => {
      mockRedisClient.set.mockRejectedValue(new Error('Redis Down'));

      await expect(service.set('test-key', { data: 'test' })).resolves.toBeUndefined();
    });
  });

  describe('del', () => {
    it('deve remover chave do cache', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await service.del('test-key');

      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
    });

    it('deve logar erro mas não lançar exceção quando falhar', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Redis Down'));

      await expect(service.del('test-key')).resolves.toBeUndefined();
    });
  });

  describe('delByPattern', () => {
    it('deve remover chaves que correspondem ao pattern', async () => {
      mockRedisClient.keys.mockResolvedValue(['key1', 'key2', 'key3']);
      mockRedisClient.del.mockResolvedValue(3);

      await service.delByPattern('companies:list');

      expect(mockRedisClient.keys).toHaveBeenCalledWith('company_management:companies:list:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith('key1', 'key2', 'key3');
    });

    it('não deve chamar del quando não houver chaves', async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      await service.delByPattern('companies:list');

      expect(mockRedisClient.keys).toHaveBeenCalled();
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });

    it('deve logar erro mas não lançar exceção quando falhar', async () => {
      mockRedisClient.keys.mockRejectedValue(new Error('Redis Down'));

      await expect(service.delByPattern('companies:list')).resolves.toBeUndefined();
    });
  });

  describe('getOrSet', () => {
    it('deve retornar valor em cache quando existir', async () => {
      const cachedData = { id: '1', name: 'Cached' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedData));

      const fetchFn = jest.fn().mockResolvedValue({ id: '1', name: 'Fresh' });
      const result = await service.getOrSet('test-key', fetchFn, 300);

      expect(result).toEqual(cachedData);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('deve buscar valor quando não existir cache', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setex.mockResolvedValue('OK');
      mockRedisClient.setnx.mockResolvedValue('OK');
      mockRedisClient.del.mockResolvedValue(1);

      const freshData = { id: '1', name: 'Fresh' };
      const fetchFn = jest.fn().mockResolvedValue(freshData);

      const result = await service.getOrSet('test-key', fetchFn, 300);

      expect(result).toEqual(freshData);
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCompaniesListKey', () => {
    it('deve gerar chave para listagem com página e busca', () => {
      const key = service.getCompaniesListKey(1, 'Empresa');
      expect(key).toBe('company_management:companies:list:page:1:search:Empresa');
    });

    it('deve usar "all" quando busca estiver vazia', () => {
      const key = service.getCompaniesListKey(1, '');
      expect(key).toBe('company_management:companies:list:page:1:search:all');
    });

    it('deve usar "all" quando busca for undefined', () => {
      const key = service.getCompaniesListKey(2, undefined as any);
      expect(key).toBe('company_management:companies:list:page:2:search:all');
    });
  });

  describe('getCompanyByIdKey', () => {
    it('deve gerar chave para empresa por ID', () => {
      const key = service.getCompanyByIdKey('uuid-123');
      expect(key).toBe('company_management:companies:id:uuid-123');
    });
  });

  describe('invalidateCompaniesCache', () => {
    it('deve invalidar cache de listagem e individual', async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      await service.invalidateCompaniesCache();

      expect(mockRedisClient.keys).toHaveBeenCalledWith('company_management:companies:list:*');
      expect(mockRedisClient.keys).toHaveBeenCalledWith('company_management:companies:id:*');
    });

    it('deve remover chaves de listagem e individual', async () => {
      mockRedisClient.keys
        .mockResolvedValueOnce(['list:1', 'list:2'])
        .mockResolvedValueOnce(['id:1', 'id:2']);
      mockRedisClient.del.mockResolvedValue(1);

      await service.invalidateCompaniesCache();

      expect(mockRedisClient.del).toHaveBeenCalledWith('list:1', 'list:2');
      expect(mockRedisClient.del).toHaveBeenCalledWith('id:1', 'id:2');
    });

    it('deve lidar com erro ao invalidar cache', async () => {
      mockRedisClient.keys.mockRejectedValue(new Error('Redis Down'));

      await expect(service.invalidateCompaniesCache()).resolves.toBeUndefined();
    });
  });
});
