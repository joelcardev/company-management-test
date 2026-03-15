import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  app.enableCors(); // Needed for the React frontend
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Gestão de Empresas API')
    .setDescription(
      'API para gerenciamento de empresas e notificações de auditoria.',
    )
    .setVersion('1.0')
    .addTag('companies', 'Operações relacionadas a empresas')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Documentação - Gestão de Empresas',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0'); // <--- Importante para Docker
  console.log(`[Back-end] Servidor HTTP pronto na porta ${port}`);
  console.log(
    `[Docs] Swagger disponível em: http://localhost:${port}/api/docs`,
  );
}
bootstrap().catch((err) => {
  console.error('[CRITICAL ERROR] Falha ao iniciar a aplicação:', err);
  process.exit(1);
});
