import { Test, TestingModule } from '@nestjs/testing';
import { QueueModule } from './queue.module';
import { RedisQueueService } from './redis-queue.service';
import { I_MESSAGE_QUEUE_SERVICE } from './interfaces/message-queue.interface';
import { EmailProcessor } from './email.processor';
import { ReconciliationService } from './reconciliation.service';
import { EmailService } from '../email/email.service';
import { BullModule, getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaModule } from '../prisma/prisma.module';

describe('QueueModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [QueueModule, PrismaModule],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('deve compilar o módulo', () => {
    expect(module).toBeDefined();
  });

  it('deve registrar a fila email-queue', () => {
    const queue = module.get<Queue>(getQueueToken('email-queue'));
    expect(queue).toBeDefined();
  });

  it('deve fornecer RedisQueueService com I_MESSAGE_QUEUE_SERVICE', () => {
    const queueService = module.get<RedisQueueService>(I_MESSAGE_QUEUE_SERVICE);
    expect(queueService).toBeDefined();
    expect(queueService).toBeInstanceOf(RedisQueueService);
  });

  it('deve fornecer EmailProcessor', () => {
    const processor = module.get<EmailProcessor>(EmailProcessor);
    expect(processor).toBeDefined();
    expect(processor).toBeInstanceOf(EmailProcessor);
  });

  it('deve fornecer ReconciliationService', () => {
    const reconciliationService = module.get<ReconciliationService>(ReconciliationService);
    expect(reconciliationService).toBeDefined();
    expect(reconciliationService).toBeInstanceOf(ReconciliationService);
  });

  it('deve exportar I_MESSAGE_QUEUE_SERVICE', () => {
    const queueService = module.get<RedisQueueService>(I_MESSAGE_QUEUE_SERVICE);
    expect(queueService).toBeInstanceOf(RedisQueueService);
  });

  describe('RedisQueueService', () => {
    it('deve ter método addEmailJob', async () => {
      const queueService = module.get<RedisQueueService>(I_MESSAGE_QUEUE_SERVICE);
      expect(queueService.addEmailJob).toBeDefined();
      expect(typeof queueService.addEmailJob).toBe('function');
    });
  });

  describe('EmailProcessor', () => {
    it('deve ter método handleSendCompanyCreationEmail', async () => {
      const processor = module.get<EmailProcessor>(EmailProcessor);
      expect(processor.handleSendCompanyCreationEmail).toBeDefined();
      expect(typeof processor.handleSendCompanyCreationEmail).toBe('function');
    });
  });

  describe('ReconciliationService', () => {
    it('deve ter método handleReconciliation', async () => {
      const service = module.get<ReconciliationService>(ReconciliationService);
      expect(service.handleReconciliation).toBeDefined();
      expect(typeof service.handleReconciliation).toBe('function');
    });
  });
});
