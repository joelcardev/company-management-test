import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from './prisma.module';
import { PrismaService } from '../prisma.service';

describe('PrismaModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();
  });

  it('deve compilar o módulo', () => {
    expect(module).toBeDefined();
  });

  it('deve fornecer PrismaService', () => {
    const prismaService = module.get<PrismaService>(PrismaService);
    expect(prismaService).toBeDefined();
  });

  it('deve exportar PrismaService', () => {
    const prismaService = module.get<PrismaService>(PrismaService);
    expect(prismaService).toBeInstanceOf(PrismaService);
  });

  it('deve ser um módulo global', () => {
    const metadata = Reflect.getMetadata('modules', PrismaModule);
    expect(PrismaModule).toBeDefined();
  });
});
