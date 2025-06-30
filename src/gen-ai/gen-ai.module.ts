import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { GenAiController } from './gen-ai.controller';
import { GenAiService } from './gen-ai.service';

@Module({
  imports: [
    // Registrando o HttpModule para fazer as requisições
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        // Define um timeout de 15 segundos para as requisições
        timeout: 15000,
        // Define a URL base da API da OpenAI
        baseURL: 'https://api.openai.com/v1',
        // Adiciona o cabeçalho de autorização em todas as requisições deste módulo
        headers: {
          Authorization: `Bearer ${configService.get<string>('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [GenAiController],
  providers: [GenAiService],
  exports: [GenAiService], // Exporta o GenAiService para outros módulos
})
export class GenAiModule {}
