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

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(I_MESSAGE_QUEUE_SERVICE)
    private readonly queueService: IMessageQueueService,
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
    // Chamado FORA da transação para não enfileirar jobs caso ocorra rollback
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
        // O registro já está no banco como PENDING, o Job de Conciliação irá recuperá-lo
      });

    return company;
  }

  async findAll(page: number = 1, limit: number = 10, search: string = '') {
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
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: { notifications: { orderBy: { createdAt: 'desc' } } },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada.');
    }
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

    return this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
    });
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
    return this.prisma.company.delete({ where: { id } });
  }
}
