import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RedisQueueService } from './redis-queue.service';
import { I_MESSAGE_QUEUE_SERVICE } from './interfaces/message-queue.interface';
import { EmailProcessor } from './email.processor';
import { EmailModule } from '../email/email.module';
import { ReconciliationService } from './reconciliation.service';

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
    // PrismaService é @Global(), disponível automaticamente
  ],
  exports: [I_MESSAGE_QUEUE_SERVICE],
})
export class QueueModule {}
