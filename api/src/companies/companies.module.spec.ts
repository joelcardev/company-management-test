import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesModule } from './companies.module';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { QueueModule } from '../queue/queue.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';

describe('CompaniesModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CompaniesModule, PrismaModule, CacheModule, QueueModule],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('deve compilar o módulo', () => {
    expect(module).toBeDefined();
  });

  it('deve fornecer CompaniesService', () => {
    const service = module.get<CompaniesService>(CompaniesService);
    expect(service).toBeDefined();
  });

  it('deve fornecer CompaniesController', () => {
    const controller = module.get<CompaniesController>(CompaniesController);
    expect(controller).toBeDefined();
  });

  it('deve importar QueueModule', () => {
    const queueService = module.get(QueueModule);
    expect(queueService).toBeDefined();
  });

  it('deve exportar CompaniesService', () => {
    const service = module.get<CompaniesService>(CompaniesService);
    expect(service).toBeInstanceOf(CompaniesService);
  });
});
