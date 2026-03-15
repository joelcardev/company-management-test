import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma.service';
import { NotificationStatus } from '../common/enums/notification-status.enum';

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly MAX_ATTEMPTS = Number(process.env.EMAIL_MAX_ATTEMPTS) || 3;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const useEthereal = !process.env.EMAIL_USER;
      if (useEthereal) {
        const testAccount = (await Promise.race([
          nodemailer.createTestAccount(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Timeout ao criar conta Ethereal')),
              5000,
            ),
          ),
        ])) as nodemailer.TestAccount;

        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
        this.logger.log('Serviço de e-mail (Mock) inicializado.');
      } else {
        this.transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: Number(process.env.EMAIL_PORT),
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });
        this.logger.log('Serviço de e-mail (Produção) inicializado.');
      }
    } catch (error) {
      this.logger.error('Falha ao inicializar transmissor de e-mail:', error);
    }
  }

  async sendCompanyCreationEmail(
    companyId: string,
    companyName: string,
    cnpj: string,
    notificationId: string,
  ) {
    const recipients = process.env.EMAIL_RECIPIENTS || 'admin@sistema.com';

    const updatedLog = await (this.prisma as any).notification.update({
      where: { id: notificationId },
      data: { attempts: { increment: 1 } },
    });

    if (updatedLog.attempts > this.MAX_ATTEMPTS) {
      await this.updateStatus(
        notificationId,
        NotificationStatus.FAILED_PERMANENTLY,
        'Limite de tentativas excedido.',
      );
      return;
    }

    try {
      if (!this.transporter) throw new Error('Serviço de e-mail indisponível.');

      await this.transporter.sendMail({
        from: '"Gestão de Empresas" <noreply@gestao.com>',
        to: recipients,
        subject: `Nova Empresa: ${companyName}`,
        html: `<h2>Nova Empresa Cadastrada</h2><p>Nome: ${companyName}</p><p>CNPJ: ${cnpj}</p>`,
      });

      await this.updateStatus(notificationId, NotificationStatus.SENT);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Erro no envio (ID: ${notificationId}): ${errorMessage}`,
      );
      const status =
        updatedLog.attempts >= this.MAX_ATTEMPTS
          ? NotificationStatus.FAILED_PERMANENTLY
          : NotificationStatus.FAILED;
      await this.updateStatus(notificationId, status, errorMessage);
      throw error;
    }
  }

  private async updateStatus(
    id: string,
    status: NotificationStatus,
    error?: string,
  ) {
    try {
      await (this.prisma as any).notification.update({
        where: { id },
        data: { status, error },
      });
    } catch (err) {
      this.logger.error(
        `Erro ao atualizar status do log ${id}: ${err.message}`,
      );
    }
  }
}
