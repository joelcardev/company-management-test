import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { IsCnpj } from '../../validators/is-cnpj.validator';

export class CreateCompanyDto {
  @ApiProperty({
    description: 'Razão social ou nome da empresa',
    example: 'Empresa Exemplo LTDA',
  })
  @IsNotEmpty({ message: 'O nome da empresa é obrigatório' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'CNPJ da empresa (com ou sem máscara)',
    example: '11.222.333/0001-81',
  })
  @IsNotEmpty({ message: 'O CNPJ é obrigatório' })
  @IsString()
  @IsCnpj({ message: 'CNPJ inválido. Verifique os dígitos e tente novamente.' })
  cnpj: string;

  @ApiPropertyOptional({
    description: 'Nome fantasia da empresa',
    example: 'Exemplo Store',
  })
  @IsOptional()
  @IsString()
  tradeName?: string;

  @ApiProperty({
    description: 'Endereço completo da empresa',
    example: 'Rua das Flores, 123, Bairro Jardim - Cidade/UF',
  })
  @IsNotEmpty({ message: 'O endereço é obrigatório' })
  @IsString()
  address: string;
}
