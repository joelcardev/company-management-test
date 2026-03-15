import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

describe('CompaniesController', () => {
  let controller: CompaniesController;
  let service: CompaniesService;

  const mockCompaniesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getLogs: jest.fn(),
    retryNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [
        {
          provide: CompaniesService,
          useValue: mockCompaniesService,
        },
      ],
    }).compile();

    controller = module.get<CompaniesController>(CompaniesController);
    service = module.get<CompaniesService>(CompaniesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto: CreateCompanyDto = {
        name: 'Test',
        cnpj: '123',
        address: 'Addr',
      };
      await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with default params', async () => {
      await controller.findAll();
      expect(service.findAll).toHaveBeenCalledWith(1, 10, undefined);
    });

    it('should call service.findAll with provided params', async () => {
      await controller.findAll('2', '20', 'search');
      expect(service.findAll).toHaveBeenCalledWith(2, 20, 'search');
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      await controller.findOne('1');
      expect(service.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('getLogs', () => {
    it('should call service.getLogs', async () => {
      await controller.getLogs('1');
      expect(service.getLogs).toHaveBeenCalledWith('1');
    });
  });

  describe('retryNotification', () => {
    it('should call service.retryNotification', async () => {
      await controller.retryNotification('1', 'n1');
      expect(service.retryNotification).toHaveBeenCalledWith('1', 'n1');
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      const dto: UpdateCompanyDto = { name: 'Updated' };
      await controller.update('1', dto);
      expect(service.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('should call service.remove', async () => {
      await controller.remove('1');
      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });
});
