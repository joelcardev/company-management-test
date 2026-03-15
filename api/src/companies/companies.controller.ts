import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar uma nova empresa' })
  @ApiResponse({ status: 201, description: 'Empresa cadastrada com sucesso.' })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou CNPJ já existente.',
  })
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as empresas com paginação e busca' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número da página (padrão: 1)',
    example: '1',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Itens por página (padrão: 10)',
    example: '10',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Termo de busca (nome ou CNPJ)',
    example: 'Empresa',
  })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.companiesService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de uma empresa específica' })
  @ApiParam({ name: 'id', description: 'UUID da empresa' })
  @ApiResponse({ status: 200, description: 'Empresa encontrada.' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada.' })
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Obter histórico de notificações de uma empresa' })
  @ApiParam({ name: 'id', description: 'UUID da empresa' })
  getLogs(@Param('id') id: string) {
    return this.companiesService.getLogs(id);
  }

  @Post(':id/notifications/:notificationId/retry')
  @ApiOperation({ summary: 'Tentar reenviar uma notificação que falhou' })
  @ApiParam({ name: 'id', description: 'UUID da empresa' })
  @ApiParam({ name: 'notificationId', description: 'UUID da notificação' })
  retryNotification(
    @Param('id') id: string,
    @Param('notificationId') notificationId: string,
  ) {
    return this.companiesService.retryNotification(id, notificationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados de uma empresa' })
  @ApiParam({ name: 'id', description: 'UUID da empresa' })
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir uma empresa' })
  @ApiParam({ name: 'id', description: 'UUID da empresa' })
  @ApiResponse({ status: 200, description: 'Empresa excluída com sucesso.' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada.' })
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }
}
