import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [QueueModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  // PrismaService e CacheService são @Global(), disponíveis automaticamente
})
export class CompaniesModule {}
