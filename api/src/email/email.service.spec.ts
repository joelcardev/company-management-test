import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma.service';
import * as nodemailer from 'nodemailer';
import { NotificationStatus } from '../common/enums/notification-status.enum';

jest.mock('nodemailer');

describe('EmailService', () => {
  let service: EmailService;

  const mockTransporter = {
    sendMail: jest.fn().mockResolvedValue({ messageId: 'msg-1' }),
  };

  const mockPrismaService = {
    notification: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
    (nodemailer.createTestAccount as jest.Mock).mockResolvedValue({
      user: 'test',
      pass: 'test',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    await service.onModuleInit();
  });

  it('deve incrementar a tentativa e atualizar para SENT após o envio com sucesso', async () => {
    mockPrismaService.notification.update.mockResolvedValue({
      id: 'notif-1',
      attempts: 1,
    });

    await service.sendCompanyCreationEmail(
      'comp-1',
      'Empresa',
      '123',
      'notif-1',
    );

    expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-1' },
      data: { attempts: { increment: 1 } },
    });

    expect(mockTransporter.sendMail).toHaveBeenCalled();

    expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-1' },
      data: { status: NotificationStatus.SENT, error: undefined },
    });
  });

  it('deve atualizar para FAILED se o envio falhar mas ainda houver tentativas', async () => {
    mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Down'));
    mockPrismaService.notification.update.mockResolvedValueOnce({
      id: 'notif-1',
      attempts: 1,
    });
    mockPrismaService.notification.findUnique.mockResolvedValue({
      id: 'notif-1',
      attempts: 1,
    });

    await expect(
      service.sendCompanyCreationEmail('comp-1', 'Empresa', '123', 'notif-1'),
    ).rejects.toThrow('SMTP Down');

    expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-1' },
      data: { status: NotificationStatus.FAILED, error: 'SMTP Down' },
    });
  });

  it('deve atualizar para FAILED_PERMANENTLY se atingir o limite de 3 tentativas', async () => {
    mockTransporter.sendMail.mockRejectedValue(new Error('Persistent Error'));
    mockPrismaService.notification.update.mockResolvedValueOnce({
      id: 'notif-1',
      attempts: 3,
    });
    mockPrismaService.notification.findUnique.mockResolvedValue({
      id: 'notif-1',
      attempts: 3,
    });

    await expect(
      service.sendCompanyCreationEmail('comp-1', 'Empresa', '123', 'notif-1'),
    ).rejects.toThrow('Persistent Error');

    expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-1' },
      data: {
        status: NotificationStatus.FAILED_PERMANENTLY,
        error: 'Persistent Error',
      },
    });
  });

  it('deve interromper se attempts > MAX_ATTEMPTS', async () => {
    mockPrismaService.notification.update.mockResolvedValueOnce({
      id: 'notif-1',
      attempts: 4,
    });

    await service.sendCompanyCreationEmail('comp-1', 'A', '1', 'notif-1');

    expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-1' },
      data: {
        status: NotificationStatus.FAILED_PERMANENTLY,
        error: 'Limite de tentativas excedido.',
      },
    });
  });
});
