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
  console.log('👥 Usuários disponíveis para teste:');
  console.log('');
  console.log('  📧 ana.oliveira@rocketcorp.com - Senha: password123');
  console.log('     👤 Ana Oliveira | 🎯 Colaboradora | 💼 Desenvolvedora Frontend Pleno | 🏢 Tech/Digital Products');
  console.log('');
  console.log('  📧 bruno.mendes@rocketcorp.com - Senha: password123');
  console.log('     👤 Bruno Mendes | 🎯 Gestor + Colaborador | 💼 Tech Lead Sênior | 🏢 Tech/Digital Products');
  console.log('');
  console.log('  📧 carla.dias@rocketcorp.com - Senha: password123');
  console.log('     👤 Carla Dias | 🎯 Comitê + Colaboradora | 💼 Head of Engineering Principal | 🏢 Tech/Digital Products');
  console.log('');
  console.log('  📧 diana.costa@rocketcorp.com - Senha: password123');
  console.log('     👤 Diana Costa | 🎯 RH + Colaboradora | 💼 People & Culture Manager Sênior | 🏢 Business/Operations');
  console.log('');
  console.log('  📧 felipe.silva@rocketcorp.com - Senha: password123');
  console.log('     👤 Felipe Silva | 🎯 Colaborador | 💼 Desenvolvedor Backend Júnior | 🏢 Tech/Digital Products');
  console.log('');
  console.log('  📧 eduardo.tech@rocketcorp.com - Senha: password123');
  console.log('     👤 Eduardo Tech | 🎯 Admin | 💼 DevOps Engineer Sênior | 🏢 Tech/Operations');
  console.log('');
  console.log('🏢 Estrutura Organizacional:');
  console.log('  👑 Carla Dias (Head) → Bruno Mendes (Tech Lead) → Ana Oliveira & Felipe Silva');
  console.log('  👑 Carla Dias (Head) → Diana Costa (RH)');
  console.log('  🔧 Eduardo Tech (Admin - Independente)');
  console.log('');
  console.log('🎯 Tipos de Usuário:');
  console.log('  • Colaborador: Participa como avaliado');
  console.log('  • Gestor: Avalia liderados + é avaliado');
  console.log('  • Comitê: Equalização final + é avaliado');
  console.log('  • RH: Configuração e acompanhamento');
  console.log('  • Admin: Gerenciamento total do sistema');
}
bootstrap();
