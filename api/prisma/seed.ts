import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seeding...');

  const companies = [
    {
      name: 'Tech Solutions Inovação LTDA',
      cnpj: '11222333000181',
      tradeName: 'TechSolutions',
      address: 'Av. Paulista, 1000, Bela Vista, São Paulo - SP',
    },
    {
      name: 'Logística Global Express S.A.',
      cnpj: '44555666000192',
      tradeName: 'Global Log',
      address: 'Rua das Cargas, 500, Industrial, Curitiba - PR',
    },
    {
      name: 'Café & Grãos Gourmet EIRELI',
      cnpj: '77888999000103',
      tradeName: 'Cafeteria Sabor',
      address: 'Alameda das Flores, 45, Centro, Belo Horizonte - MG',
    },
  ];

  for (const company of companies) {
    await prisma.company.upsert({
      where: { cnpj: company.cnpj },
      update: {},
      create: company,
    });
  }

  console.log('Seeding concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
