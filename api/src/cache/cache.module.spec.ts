import { Test, TestingModule } from '@nestjs/testing';
import { CacheModule } from './cache.module';
import { CacheService, CACHE_REDIS_CLIENT } from './cache.service';
import Redis from 'ioredis';

describe('CacheModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CacheModule],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('deve compilar o módulo', () => {
    expect(module).toBeDefined();
  });

  it('deve fornecer CacheService', () => {
    const cacheService = module.get<CacheService>(CacheService);
    expect(cacheService).toBeDefined();
  });

  it('deve fornecer Redis client com CACHE_REDIS_CLIENT', () => {
    const redisClient = module.get<Redis>(CACHE_REDIS_CLIENT);
    expect(redisClient).toBeDefined();
    expect(redisClient).toBeInstanceOf(Redis);
  });

  it('deve exportar CacheService', () => {
    const cacheService = module.get<CacheService>(CacheService);
    expect(cacheService).toBeInstanceOf(CacheService);
  });

  it('deve exportar CACHE_REDIS_CLIENT', () => {
    const redisClient = module.get<Redis>(CACHE_REDIS_CLIENT);
    expect(redisClient).toBeInstanceOf(Redis);
  });

  it('deve configurar Redis com variáveis de ambiente', () => {
    const redisClient = module.get<Redis>(CACHE_REDIS_CLIENT);
    expect(redisClient).toBeDefined();
  });

  describe('CacheService', () => {
    it('deve ter método get', async () => {
      const cacheService = module.get<CacheService>(CacheService);
      expect(cacheService.get).toBeDefined();
      expect(typeof cacheService.get).toBe('function');
    });

    it('deve ter método set', async () => {
      const cacheService = module.get<CacheService>(CacheService);
      expect(cacheService.set).toBeDefined();
      expect(typeof cacheService.set).toBe('function');
    });

    it('deve ter método del', async () => {
      const cacheService = module.get<CacheService>(CacheService);
      expect(cacheService.del).toBeDefined();
      expect(typeof cacheService.del).toBe('function');
    });

    it('deve ter método delByPattern', async () => {
      const cacheService = module.get<CacheService>(CacheService);
      expect(cacheService.delByPattern).toBeDefined();
      expect(typeof cacheService.delByPattern).toBe('function');
    });

    it('deve ter método getOrSet', async () => {
      const cacheService = module.get<CacheService>(CacheService);
      expect(cacheService.getOrSet).toBeDefined();
      expect(typeof cacheService.getOrSet).toBe('function');
    });

    it('deve ter método getCompaniesListKey', async () => {
      const cacheService = module.get<CacheService>(CacheService);
      expect(cacheService.getCompaniesListKey).toBeDefined();
      expect(typeof cacheService.getCompaniesListKey).toBe('function');
    });

    it('deve ter método getCompanyByIdKey', async () => {
      const cacheService = module.get<CacheService>(CacheService);
      expect(cacheService.getCompanyByIdKey).toBeDefined();
      expect(typeof cacheService.getCompanyByIdKey).toBe('function');
    });

    it('deve ter método invalidateCompaniesCache', async () => {
      const cacheService = module.get<CacheService>(CacheService);
      expect(cacheService.invalidateCompaniesCache).toBeDefined();
      expect(typeof cacheService.invalidateCompaniesCache).toBe('function');
    });
  });
});
