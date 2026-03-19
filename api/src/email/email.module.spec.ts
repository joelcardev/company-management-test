import { Test, TestingModule } from '@nestjs/testing';
import { EmailModule } from './email.module';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma.service';

describe('EmailModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [EmailModule],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('deve compilar o módulo', () => {
    expect(module).toBeDefined();
  });

  it('deve fornecer EmailService', () => {
    const emailService = module.get<EmailService>(EmailService);
    expect(emailService).toBeDefined();
  });

  it('deve fornecer PrismaService (Global)', () => {
    const prismaService = module.get<PrismaService>(PrismaService);
    expect(prismaService).toBeDefined();
  });

  it('deve exportar EmailService', () => {
    const emailService = module.get<EmailService>(EmailService);
    expect(emailService).toBeInstanceOf(EmailService);
  });

  describe('EmailService', () => {
    it('deve ter método sendCompanyCreationEmail', async () => {
      const emailService = module.get<EmailService>(EmailService);
      expect(emailService.sendCompanyCreationEmail).toBeDefined();
      expect(typeof emailService.sendCompanyCreationEmail).toBe('function');
    });

    it('deve implementar OnModuleInit', async () => {
      const emailService = module.get<EmailService>(EmailService);
      expect(emailService.onModuleInit).toBeDefined();
      expect(typeof emailService.onModuleInit).toBe('function');
    });
  });
});
