import { Test, TestingModule } from '@nestjs/testing';
import { RedisQueueService } from './redis-queue.service';
import { getQueueToken } from '@nestjs/bull';

describe('RedisQueueService', () => {
  let service: RedisQueueService;

  const mockQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisQueueService,
        { provide: getQueueToken('email-queue'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<RedisQueueService>(RedisQueueService);
  });

  it('deve adicionar um job à fila com sucesso', async () => {
    const data = {
      companyId: '1',
      companyName: 'A',
      cnpj: '123',
      notificationId: 'n1',
    };
    await service.addEmailJob(data);

    expect(mockQueue.add).toHaveBeenCalledWith(
      'sendCompanyCreationEmail',
      data,
      expect.any(Object),
    );
  });

  it('deve lançar erro se a fila falhar ao adicionar', async () => {
    mockQueue.add.mockRejectedValue(new Error('Redis Down'));
    const data = { companyId: '1', companyName: 'A', cnpj: '123' };

    await expect(service.addEmailJob(data)).rejects.toThrow('Redis Down');
  });
});
