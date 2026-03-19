import { Global, Module } from '@nestjs/common';
import { CacheService, CACHE_REDIS_CLIENT } from './cache.service';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: CACHE_REDIS_CLIENT,
      useFactory: () => {
        const redis = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
          db: Number(process.env.REDIS_DB) || 0,
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number) => {
            if (times > 3) return null;
            return Math.min(times * 50, 2000);
          },
          lazyConnect: true,
        });

        redis.on('error', (error: any) => {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error('[Redis Cache] Error:', errorMessage);
        });

        redis.on('connect', () => {
          console.log('[Redis Cache] Connected successfully');
        });

        return redis;
      },
    },
    CacheService,
  ],
  exports: [CACHE_REDIS_CLIENT, CacheService],
})
export class CacheModule {}
