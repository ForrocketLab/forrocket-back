import * as dotenv from 'dotenv';
// Carrega variáveis de ambiente ANTES de qualquer outra coisa
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração de CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:4200'], // URLs permitidas
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Configuração de validação global
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    validateCustomDecorators: true,
  }));

  // Configuração do Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('RPE - ROCKET PERFORMANCE & ENGAGEMENT')
    .setDescription(`
      RPE - ROCKET PERFORMANCE & ENGAGEMENT
    `)
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Insira apenas o token JWT (sem "Bearer")',
        in: 'header',
      },
      'bearer',
    )
    .addTag('Autenticação', 'Endpoints para login, perfil e status da API')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });
  
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'RPE API - Documentação',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Servidor RPE rodando na porta ${port}`);
  console.log(`📚 Documentação Swagger: http://localhost:${port}/api-docs`);
  console.log(`🔐 Endpoint de login: http://localhost:${port}/api/auth/login`);
  console.log(`📊 Status da API: http://localhost:${port}/api/auth/status`);
  console.log('');
  console.log('👥 Usuários para teste:');
  console.log('  - ana.oliveira@rocketcorp.com (password123) - Colaborador');
  console.log('  - bruno.mendes@rocketcorp.com (password123) - Gestor');
  console.log('  - carla.dias@rocketcorp.com (password123) - Comitê');
}
bootstrap();
