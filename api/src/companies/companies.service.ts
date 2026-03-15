import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  Inject,
} from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { PrismaService } from '../prisma.service';
import { I_MESSAGE_QUEUE_SERVICE } from '../queue/interfaces/message-queue.interface';
import type { IMessageQueueService } from '../queue/interfaces/message-queue.interface';
import { NotificationStatus } from '../common/enums/notification-status.enum';
import { NotificationType } from '../common/enums/notification-type.enum';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);
  private readonly CACHE_TTL_LIST = Number(process.env.CACHE_TTL_LIST) || 300;
  private readonly CACHE_TTL_INDIVIDUAL =
    Number(process.env.CACHE_TTL_INDIVIDUAL) || 120;
  private readonly DEFAULT_PAGE_LIMIT = 10;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(I_MESSAGE_QUEUE_SERVICE)
    private readonly queueService: IMessageQueueService,
    private readonly cacheService: CacheService,
  ) {}

  async create(createCompanyDto: CreateCompanyDto) {
    const { company, notification } = await this.prisma.$transaction(
      async (tx) => {
        const existingCnpj = await tx.company.findUnique({
          where: { cnpj: createCompanyDto.cnpj },
        });

        if (existingCnpj) {
          throw new ConflictException(
            'Já existe uma empresa cadastrada com este CNPJ.',
          );
        }

        const company = await tx.company.create({
          data: createCompanyDto,
        });

        // 1. Criar Log de Notificação Imediatamente (Transactional Outbox-ish)
        const recipients = process.env.EMAIL_RECIPIENTS || 'admin@sistema.com';
        const notification = await (tx as any).notification.create({
          data: {
            companyId: company.id,
            type: NotificationType.COMPANY_CREATION,
            status: NotificationStatus.PENDING,
            sentTo: recipients,
            attempts: 0, // Será incrementado pelo Worker
          },
        });

        return { company, notification };
      },
    );

    // 2. Envio assíncrono via Fila (Passando o ID do Log)
    await this.queueService
      .addEmailJob({
        companyId: company.id,
        companyName: company.name,
        cnpj: company.cnpj,
        notificationId: notification.id,
      })
      .catch((err) => {
        this.logger.error(
          `[Erro] Falha ao enfileirar job para ${company.id}:`,
          err,
        );
      });

    // 3. Invalida cache de listagem
    await this.cacheService.invalidateCompaniesCache();

    return company;
  }

  async findAll(
    page: number = 1,
    limit: number = this.DEFAULT_PAGE_LIMIT,
    search: string = '',
  ) {
    const skip = (page - 1) * limit;

    let whereClause = {};
    if (search) {
      whereClause = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { cnpj: { contains: search.replace(/\D/g, '') } },
          { tradeName: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const cacheKey = this.cacheService.getCompaniesListKey(page, search);

    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [data, total] = await Promise.all([
          this.prisma.company.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              _count: {
                select: { notifications: true },
              },
            },
          }),
          this.prisma.company.count({ where: whereClause }),
        ]);

        return {
          data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        };
      },
      this.CACHE_TTL_LIST,
    );
  }

  async findOne(id: string) {
    const cacheKey = this.cacheService.getCompanyByIdKey(id);

    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const company = await this.prisma.company.findUnique({
      where: { id },
      include: { notifications: { orderBy: { createdAt: 'desc' } } },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    await this.cacheService.set(cacheKey, company, this.CACHE_TTL_INDIVIDUAL);

    return company;
  }

  async getLogs(id: string) {
    await this.findOne(id);
    return (this.prisma as any).notification.findMany({
      where: { companyId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    await this.findOne(id);

    if (updateCompanyDto.cnpj) {
      const existing = await this.prisma.company.findUnique({
        where: { cnpj: updateCompanyDto.cnpj },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          'Este CNPJ já está sendo usado por outra empresa.',
        );
      }
    }

    const company = await this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
    });

    // Invalida cache
    await this.cacheService.invalidateCompaniesCache();
    await this.cacheService.del(this.cacheService.getCompanyByIdKey(id));

    return company;
  }

  async retryNotification(companyId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: { company: true },
    });

    if (!notification || notification.companyId !== companyId) {
      throw new NotFoundException('Notificação não encontrada.');
    }

    // Adiciona novamente à fila com o ID original
    await this.queueService.addEmailJob({
      companyId: notification.company.id,
      companyName: notification.company.name,
      cnpj: notification.company.cnpj,
      notificationId: notification.id,
    });

    return { status: 'enqueued' };
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.company.delete({ where: { id } });

    // Invalida cache
    await this.cacheService.invalidateCompaniesCache();
    await this.cacheService.del(this.cacheService.getCompanyByIdKey(id));

    return true;
  }
}
