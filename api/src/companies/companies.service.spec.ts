import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import { PrismaService } from '../prisma.service';
import { I_MESSAGE_QUEUE_SERVICE } from '../queue/interfaces/message-queue.interface';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('CompaniesService', () => {
  let service: CompaniesService;

  const mockPrismaService = {
    company: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    notification: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };


  const mockQueueService = {
    addEmailJob: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: I_MESSAGE_QUEUE_SERVICE, useValue: mockQueueService },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  describe('create', () => {
    it('deve criar uma empresa com sucesso', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue(null);
      mockPrismaService.company.create.mockResolvedValue({
        id: '1',
        name: 'A',
        cnpj: '1',
      });
      mockPrismaService.notification.create.mockResolvedValue({ id: 'n1' });

      const result = await service.create({
        name: 'A',
        cnpj: '1',
        address: 'X',
      });
      expect(result.id).toBe('1');
    });
  });

  describe('findAll', () => {
    it('deve retornar lista sem busca', async () => {
      mockPrismaService.company.findMany.mockResolvedValue([{ id: '1' }]);
      mockPrismaService.company.count.mockResolvedValue(1);
      const res = await service.findAll();
      expect(res.data).toHaveLength(1);
      expect(mockPrismaService.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });

    it('deve retornar lista com busca', async () => {
      mockPrismaService.company.findMany.mockResolvedValue([{ id: '1' }]);
      mockPrismaService.company.count.mockResolvedValue(1);
      const res = await service.findAll(1, 10, 'Teste');
      expect(res.data).toHaveLength(1);
      expect(mockPrismaService.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar empresa', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ id: '1' });
      const res = await service.findOne('1');
      expect(res.id).toBe('1');
    });
  });

  describe('update', () => {
    it('deve atualizar com sucesso sem mudar CNPJ', async () => {
      mockPrismaService.company.findUnique.mockResolvedValueOnce({ id: '1' }); // findOne
      mockPrismaService.company.update.mockResolvedValue({
        id: '1',
        name: 'Novo',
      });

      const res = await service.update('1', { name: 'Novo' });
      expect(res.name).toBe('Novo');
      expect(mockPrismaService.company.findUnique).toHaveBeenCalledTimes(1);
    });

    it('deve atualizar com sucesso mudando CNPJ', async () => {
      mockPrismaService.company.findUnique.mockResolvedValueOnce({ id: '1' }); // findOne
      mockPrismaService.company.findUnique.mockResolvedValueOnce(null); // cnpj check
      mockPrismaService.company.update.mockResolvedValue({
        id: '1',
        cnpj: '123',
      });

      const res = await service.update('1', { cnpj: '123' });
      expect(res.cnpj).toBe('123');
      expect(mockPrismaService.company.findUnique).toHaveBeenCalledTimes(2);
    });

    it('deve dar erro se CNPJ já existe em outra empresa', async () => {
      mockPrismaService.company.findUnique.mockResolvedValueOnce({ id: '1' }); // findOne
      mockPrismaService.company.findUnique.mockResolvedValueOnce({
        id: '2',
        cnpj: '123',
      }); // cnpj check

      await expect(service.update('1', { cnpj: '123' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('retryNotification', () => {
    it('deve re-enfileirar notificação com sucesso', async () => {
      const mockNotification = {
        id: 'n1',
        companyId: '1',
        company: { id: '1', name: 'Empresa', cnpj: '123' },
      };
      mockPrismaService.notification.findUnique.mockResolvedValue(
        mockNotification,
      );

      const res = await service.retryNotification('1', 'n1');
      expect(res.status).toBe('enqueued');
      expect(mockQueueService.addEmailJob).toHaveBeenCalled();
    });

    it('deve dar erro se notificação não existe', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue(null);
      await expect(service.retryNotification('1', 'n1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve dar erro se notificação pertence a outra empresa', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue({
        id: 'n1',
        companyId: '2',
      });
      await expect(service.retryNotification('1', 'n1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deve remover', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ id: '1' });
      mockPrismaService.company.delete.mockResolvedValue({ id: '1' });
      await service.remove('1');
      expect(mockPrismaService.company.delete).toHaveBeenCalled();
    });
  });

  describe('getLogs', () => {
    it('deve retornar logs de notificações', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ id: '1' });
      mockPrismaService.notification.findMany.mockResolvedValue([{ id: 'n1' }]);

      const res = await service.getLogs('1');
      expect(res).toHaveLength(1);
    });
  });
});
