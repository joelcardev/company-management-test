import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { EmailService } from '../email/email.service';

@Processor('email-queue')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  @Process('sendCompanyCreationEmail')
  async handleSendCompanyCreationEmail(
    job: Job<{
      companyId: string;
      companyName: string;
      cnpj: string;
      notificationId?: string;
    }>,
  ) {
    this.logger.log(
      `Processando job de e-mail para a empresa: ${job.data.companyName}`,
    );
    const { companyId, companyName, cnpj, notificationId } = job.data;

    if (!notificationId) {
      this.logger.error('Job recebido sem notificationId. Abortando.');
      return;
    }

    try {
      await this.emailService.sendCompanyCreationEmail(
        companyId,
        companyName,
        cnpj,
        notificationId,
      );
      this.logger.log(
        `E-mail enviado com sucesso para a empresa: ${companyName}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Falha ao processar e-mail para ${companyName}: ${errorMessage}`,
      );
      throw error; // Permite que o Bull tente novamente (retry)
    }
  }
}
