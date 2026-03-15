import { Test, TestingModule } from '@nestjs/testing';
import { ReconciliationService } from './reconciliation.service';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';

describe('ReconciliationService', () => {
  let service: ReconciliationService;

  const mockPrismaService = {
    notification: {
      findMany: jest.fn(),
    },
  };

  const mockEmailService = {
    sendCompanyCreationEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReconciliationService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<ReconciliationService>(ReconciliationService);
  });

  it('deve processar notificações pendentes/falhas corretamente', async () => {
    const notifs = [
      { id: '1', company: { id: 'c1', name: 'Emp A', cnpj: '123' } },
      { id: '2', company: { id: 'c2', name: 'Emp B', cnpj: '456' } },
    ];
    mockPrismaService.notification.findMany.mockResolvedValue(notifs);

    await service.handleReconciliation();

    expect(mockPrismaService.notification.findMany).toHaveBeenCalled();
    expect(mockEmailService.sendCompanyCreationEmail).toHaveBeenCalledTimes(2);
    expect(mockEmailService.sendCompanyCreationEmail).toHaveBeenCalledWith(
      'c1',
      'Emp A',
      '123',
      '1',
    );
  });

  it('não deve fazer nada se não houver notificações para conciliar', async () => {
    mockPrismaService.notification.findMany.mockResolvedValue([]);
    await service.handleReconciliation();
    expect(mockEmailService.sendCompanyCreationEmail).not.toHaveBeenCalled();
  });

  it('deve continuar processando mesmo se um envio falhar', async () => {
    const notifs = [
      { id: '1', company: { id: 'c1', name: 'A', cnpj: '1' } },
      { id: '2', company: { id: 'c2', name: 'B', cnpj: '2' } },
    ];
    mockPrismaService.notification.findMany.mockResolvedValue(notifs);
    mockEmailService.sendCompanyCreationEmail.mockRejectedValueOnce(
      new Error('Falha'),
    );

    await service.handleReconciliation();

    expect(mockEmailService.sendCompanyCreationEmail).toHaveBeenCalledTimes(2);
  });
});
