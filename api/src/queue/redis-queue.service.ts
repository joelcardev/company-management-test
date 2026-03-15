import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { IMessageQueueService } from './interfaces/message-queue.interface';

@Injectable()
export class RedisQueueService implements IMessageQueueService {
  private readonly logger = new Logger(RedisQueueService.name);

  constructor(@InjectQueue('email-queue') private readonly emailQueue: Queue) {}

  async addEmailJob(data: {
    companyId: string;
    companyName: string;
    cnpj: string;
    notificationId?: string;
  }): Promise<void> {
    try {
      await this.emailQueue.add('sendCompanyCreationEmail', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
      });
      this.logger.log(
        `Job de e-mail adicionado à fila para a empresa: ${data.companyName}`,
      );
    } catch (error) {
      this.logger.error('Erro ao adicionar job à fila do Redis:', error);
      throw error;
    }
  }
}
