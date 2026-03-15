import { Test, TestingModule } from '@nestjs/testing';
import { EmailProcessor } from './email.processor';
import { EmailService } from '../email/email.service';

describe('EmailProcessor', () => {
  let processor: EmailProcessor;
  let emailService: EmailService;

  const mockEmailService = {
    sendCompanyCreationEmail: jest.fn(),
  };

  const mockJob = {
    data: {
      companyId: 'uuid-1',
      companyName: 'Empresa Teste',
      cnpj: '12.345.678/0001-90',
      notificationId: 'notif-1',
    },
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    processor = module.get<EmailProcessor>(EmailProcessor);
    emailService = module.get<EmailService>(EmailService);
  });

  it('deve chamar o EmailService com os dados corretos do job', async () => {
    await processor.handleSendCompanyCreationEmail(mockJob);

    expect(emailService.sendCompanyCreationEmail).toHaveBeenCalledWith(
      'uuid-1',
      'Empresa Teste',
      '12.345.678/0001-90',
      'notif-1',
    );
  });

  it('deve lançar erro se o EmailService falhar para permitir o retry do Bull', async () => {
    mockEmailService.sendCompanyCreationEmail.mockRejectedValue(
      new Error('SMTP falhou'),
    );

    await expect(
      processor.handleSendCompanyCreationEmail(mockJob),
    ).rejects.toThrow('SMTP falhou');
  });

  it('deve abortar e logar erro se o job não tiver notificationId', async () => {
    const badJob = { data: { companyId: '1' } } as any;
    const loggerSpy = jest.spyOn((processor as any).logger, 'error');

    await processor.handleSendCompanyCreationEmail(badJob);

    expect(emailService.sendCompanyCreationEmail).not.toHaveBeenCalled();
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('Job recebido sem notificationId'),
    );
  });
});
