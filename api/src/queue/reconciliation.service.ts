import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationStatus } from '../common/enums/notification-status.enum';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Cron Job: Verifica notificações pendentes ou falhas a cada 1 minuto.
   * Busca registros que não estejam em SENT ou FAILED_PERMANENTLY e tenta o re-envio.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleReconciliation() {
    this.logger.log('Iniciando ciclo de conciliação de notificações...');
    const maxAttempts = Number(process.env.EMAIL_MAX_ATTEMPTS) || 3;

    const notificationsToRetry = await (
      this.prisma as any
    ).notification.findMany({
      where: {
        status: { in: [NotificationStatus.FAILED, NotificationStatus.PENDING] },
        attempts: { lt: maxAttempts },
        createdAt: { lt: new Date(Date.now() - 30000) },
      },
      include: { company: true },
    });

    if (notificationsToRetry.length === 0) {
      this.logger.log('Nenhuma notificação encontrada para conciliação.');
      return;
    }

    this.logger.log(
      `Encontradas ${notificationsToRetry.length} notificações para re-tentativa.`,
    );

    for (const notif of notificationsToRetry) {
      try {
        await this.emailService.sendCompanyCreationEmail(
          notif.company.id,
          notif.company.name,
          notif.company.cnpj,
          notif.id,
        );
        this.logger.log(`Conciliação concluída para notificação ${notif.id}.`);
      } catch (err) {
        this.logger.error(
          `Falha na conciliação para notificação ${notif.id}: ${err.message}`,
        );
      }
    }
  }
}
