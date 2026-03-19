import { Injectable, Logger, Inject } from '@nestjs/common';
import Redis from 'ioredis';

export const CACHE_REDIS_CLIENT = 'CACHE_REDIS_CLIENT';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly cachePrefix = 'company_management';

  constructor(@Inject(CACHE_REDIS_CLIENT) private readonly redis: Redis) {}

  private generateKey(pattern: string, ...args: (string | number)[]): string {
    return [this.cachePrefix, pattern, ...args].filter(Boolean).join(':');
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (value !== null) {
        this.logger.debug(`Cache HIT: ${key}`);
        return JSON.parse(value) as T;
      }
      this.logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Erro ao ler cache (${key}):`, errorMessage);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Erro ao salvar cache (${key}):`, errorMessage);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Erro ao remover cache (${key}):`, errorMessage);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    try {
      const fullPattern = this.generateKey(pattern);
      const keys = await this.redis.keys(`${fullPattern}:*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.log(`Cache invalidado: ${keys.length} chaves removidas`);
      }
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Erro ao invalidar cache (${pattern}):`, errorMessage);
    }
  }

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const lockKey = `lock:${key}`;
    const lockAcquired = await this.redis.set(lockKey, '1', 'EX', 5, 'NX');

    if (!lockAcquired) {
      await new Promise((r) => setTimeout(r, 100));
      const retry = await this.get<T>(key);
      if (retry !== null) return retry;
    }

    try {
      const value = await fetchFn();
      await this.set(key, value, ttlSeconds);
      return value;
    } finally {
      if (lockAcquired === 'OK') await this.del(lockKey);
    }
  }

  getCompaniesListKey(page: number, search: string): string {
    return this.generateKey(
      'companies',
      'list',
      `page:${page}`,
      `search:${search || 'all'}`,
    );
  }

  getCompanyByIdKey(id: string): string {
    return this.generateKey('companies', 'id', id);
  }

  async invalidateCompaniesCache(): Promise<void> {
    await this.delByPattern('companies:list');
    await this.delByPattern('companies:id');
  }
}
