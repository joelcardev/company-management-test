import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RedisQueueService } from './redis-queue.service';
import { I_MESSAGE_QUEUE_SERVICE } from './interfaces/message-queue.interface';
import { EmailProcessor } from './email.processor';
import { EmailModule } from '../email/email.module';
import { ReconciliationService } from './reconciliation.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email-queue',
    }),
    EmailModule,
  ],
  providers: [
    {
      provide: I_MESSAGE_QUEUE_SERVICE,
      useClass: RedisQueueService,
    },
    EmailProcessor,
    ReconciliationService,
    PrismaService, // <--- Adicionado aqui
  ],
  exports: [I_MESSAGE_QUEUE_SERVICE],
})
export class QueueModule {}
