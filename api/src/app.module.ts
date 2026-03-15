import { Module, Global } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import Redis from 'ioredis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompaniesModule } from './companies/companies.module';
import { PrismaService } from './prisma.service';
import { BullModule } from '@nestjs/bull';
import { QueueModule } from './queue/queue.module';
import { CacheService, CACHE_REDIS_CLIENT } from './cache/cache.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        db: Number(process.env.REDIS_DB) || 0,
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) return null;
          return Math.min(times * 50, 2000);
        },
      },
    }),
    CompaniesModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
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
export class AppModule {}
